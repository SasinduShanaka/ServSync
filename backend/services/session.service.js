// src/services/session.service.js
import Branch from '../models/branch.model.js';
import Session from '../models/session.model.js';
import Token from '../models/token.model.js';
import { pushCounterDisplay } from '../realtime/socket.js';

export async function createSessionService(payload) {
  const { branchId, counterId, insuranceTypeId, serviceDate, slots } = payload;

  // normalize serviceDate to UTC midnight
  function parseServiceDate(input) {
    if (!input) throw new Error('serviceDate is required');
    // If already a Date
    if (input instanceof Date) {
      if (isNaN(input.getTime())) throw new Error('Invalid serviceDate');
      return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
    }
    const s = String(input);
    // If format YYYY-MM-DD, use Date.UTC
    const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymd) {
      const [_, y, m, d] = ymd;
      return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    }
    // Try parsing an ISO date/time string
    const parsed = new Date(s);
    if (!isNaN(parsed.getTime())) {
      return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
    }
    throw new Error('Invalid serviceDate format');
  }

  let day;
  try {
    day = parseServiceDate(serviceDate);
  } catch (err) {
    throw new Error(`Invalid serviceDate: ${err.message}`);
  }

  // branch & counter validation
  const branch = await Branch.findById(branchId).lean();
  if (!branch) throw new Error('Branch not found');

  const counter = branch.counters.find(c => String(c._id) === String(counterId));
  if (!counter) throw new Error('Counter not found in this branch');

  if (String(counter.insuranceType) !== String(insuranceTypeId)) {
    throw new Error('Selected insurance type does not match this counter');
  }

  // sanitize slots (convert string → Date if needed) and validate
  if (!Array.isArray(slots) || slots.length === 0) throw new Error('Slots must be a non-empty array');
  const normalizedSlots = slots.map((s, idx) => {
    const start = s.startTime instanceof Date ? s.startTime : new Date(String(s.startTime));
    const end = s.endTime instanceof Date ? s.endTime : new Date(String(s.endTime));
    if (isNaN(start.getTime()) || isNaN(end.getTime())) throw new Error(`Invalid startTime/endTime in slot ${idx + 1}`);
    if (start >= end) throw new Error(`Slot ${idx + 1}: startTime must be before endTime`);
    // ensure slots fall within the same UTC day as serviceDate
    const svcDay = day.toISOString().slice(0,10);
    if (!start.toISOString().startsWith(svcDay) || !end.toISOString().startsWith(svcDay)) {
      throw new Error(`Slot ${idx + 1}: times must be within serviceDate day (UTC)`);
    }
    return {
      slotId: s.slotId, // optional; model will generate if missing
      startTime: start,
      endTime: end,
      capacity: Number(s.capacity),
      booked: Number(s.booked || 0),
      overbook: Number(s.overbook || 0)
    };
  });

  try {
    const doc = await Session.create({
      branch: branchId,
      counterId,
      insuranceType: insuranceTypeId,
      serviceDate: day,
      slots: normalizedSlots,
      status: 'SCHEDULED',
      holidaysFlag: false
    });
    return doc;
  } catch (err) {
    if (err && err.code === 11000) {
      throw new Error('A session for this branch/counter/date already exists');
    }
    throw err;
  }
}

export async function listSessionsService({ branchId, date, counterId, insuranceTypeId }) {
  const day = new Date(`${date}T00:00:00.000Z`);
  const q = { branch: branchId, serviceDate: day };
  if (counterId) q.counterId = counterId;
  if (insuranceTypeId) q.insuranceType = insuranceTypeId;
  
  return Session.find(q).lean();
}

export async function updateSessionService(sessionId, updates) {
  if (!sessionId) throw new Error('sessionId required');
  const session = await Session.findById(sessionId);
  if (!session) throw new Error('Session not found');

  // If updates contain slots, sanitize similar to create
  if (updates.slots) {
    if (!Array.isArray(updates.slots)) throw new Error('slots must be an array');
    const svcDay = session.serviceDate.toISOString().slice(0,10);
    const normalized = updates.slots.map((s, idx) => {
      const start = s.startTime instanceof Date ? s.startTime : new Date(String(s.startTime));
      const end = s.endTime instanceof Date ? s.endTime : new Date(String(s.endTime));
      if (isNaN(start.getTime()) || isNaN(end.getTime())) throw new Error(`Invalid start/end in slot ${idx+1}`);
      if (start >= end) throw new Error(`Slot ${idx+1}: start must be before end`);
      if (!start.toISOString().startsWith(svcDay) || !end.toISOString().startsWith(svcDay)) throw new Error(`Slot ${idx+1}: times must be within serviceDate (UTC)`);
      return { startTime: start, endTime: end, capacity: Number(s.capacity || 1), booked: Number(s.booked || 0), overbook: Number(s.overbook || 0) };
    });
    session.slots = normalized;
  }

  if (typeof updates.holidaysFlag !== 'undefined') session.holidaysFlag = !!updates.holidaysFlag;
  if (typeof updates.status !== 'undefined') session.status = updates.status;

  // Save and return updated document
  await session.save();
  return session.toObject();
}

export async function findSessionByIdService(sessionId){
  if (!sessionId) throw new Error('sessionId required');
  const doc = await Session.findById(sessionId).lean();
  return doc;
}

function findActiveSlotIdByNow(session){
  if (!session?.slots) return null;
  const now = Date.now();
  const slot = session.slots.find(s => new Date(s.startTime).getTime() <= now && now < new Date(s.endTime).getTime());
  return slot ? slot.slotId : null;
}

export async function controlSessionService(sessionId, action, { override = false, by = 'system', slotId = null } = {}){
  if (!sessionId) throw new Error('sessionId required');
  if (!action) throw new Error('action required');
  const session = await Session.findById(sessionId);
  if (!session) throw new Error('Session not found');

  const now = Date.now();
  const activeSlot = session.slots.find(s => new Date(s.startTime).getTime() <= now && now < new Date(s.endTime).getTime());
  const within10Min = activeSlot ? (now >= new Date(activeSlot.startTime).getTime() - 10*60*1000) : false;

  switch (action) {
    case 'start':
      if (!activeSlot) {
        if (!override) throw new Error('No active slot at this time. You can override to force start.');
      } else if (!within10Min && !override) {
        throw new Error('Too early to start. You can override to force start.');
      }
      session.status = 'RUNNING';
      if (slotId){
        const found = session.slots.find(s => String(s.slotId) === String(slotId));
        if (!found) throw new Error('slotId not part of session');
        session.activeSlotId = found.slotId;
      } else {
        session.activeSlotId = activeSlot ? activeSlot.slotId : session.activeSlotId;
      }
      break;
    case 'pause':
      session.status = 'SCHEDULED';
      break;
    case 'resume':
      session.status = 'RUNNING';
      session.activeSlotId = activeSlot ? activeSlot.slotId : session.activeSlotId;
      break;
    case 'end':
      session.status = 'COMPLETED';
      break;
    default:
      throw new Error('Unknown action');
  }

  await session.save();
  // Hygiene: if any duplicate SERVING tokens exist for this session's counter, keep the most recent and return others to waiting
  try{
    const serving = await Token.find({ session: session._id, currentCounterId: session.counterId, status: 'serving' })
      .sort({ 'timing.serviceStartAt': -1, updatedAt: -1 })
      .lean();
    if (serving.length > 1){
      const keep = String(serving[0]._id);
      const now = new Date();
      const demoteIds = serving.filter(t => String(t._id) !== keep).map(t => t._id);
      if (demoteIds.length){
        await Token.updateMany(
          { _id: { $in: demoteIds } },
          { $set: { status:'waiting', currentCounterId: null, 'timing.arrivedAt': now }, $push: { history: { action:'auto_return_to_waiting_on_session_control', at: now } } }
        );
        try { await pushCounterDisplay({ sessionId: session._id, counterId: session.counterId }); } catch {}
      }
    }
  }catch{ /* ignore */ }
  return session.toObject();
}

// Delete sessions for a given branch/date/insuranceType (group-level delete)
export async function deleteSessionsService({ branchId, date, insuranceTypeId }) {
  if (!branchId || !date || !insuranceTypeId) throw new Error('branchId, date, insuranceTypeId are required');
  const day = new Date(`${date}T00:00:00.000Z`);
  const res = await Session.deleteMany({ branch: branchId, serviceDate: day, insuranceType: insuranceTypeId });
  return res?.deletedCount || 0;
}
