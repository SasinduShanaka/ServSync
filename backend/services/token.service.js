import Token from '../models/token.model.js';
import Session from '../models/session.model.js';
import AuditEvent from '../models/auditEvent.model.js';
import { normalizeToUTCDate } from './tokenNumber.service.js';
import Appointment from '../models/appointment.model.js';
import { enqueueSms } from './sms.service.js';
import { generateFeedbackLink } from './feedbackLink.service.js';
import { pushCounterDisplay } from '../realtime/socket.js';

// Ensure there is at most one SERVING token for a given session+counter.
// If multiple are found (e.g., after app crash/relogin), demote all but the newest
// to 'waiting' and send display updates.
async function ensureSingleServing({ sessionId, counterId, keepTokenId=null }){
  try{
    const serving = await Token.find({ session: sessionId, currentCounterId: counterId, status: 'serving' })
      .sort({ 'timing.serviceStartAt': -1, updatedAt: -1 })
      .lean();
    if (!serving || serving.length <= 1) return;
    const keep = keepTokenId ? String(keepTokenId) : String(serving[0]._id);
    const now = new Date();
    const toDemote = serving.filter(t => String(t._id) !== keep).map(t => t._id);
    if (toDemote.length){
      await Token.updateMany(
        { _id: { $in: toDemote } },
        { $set: { status: 'waiting', currentCounterId: null, 'timing.arrivedAt': now }, $push: { history: { action:'auto_return_to_waiting', at: now, note:'Resolved duplicate serving token' } } }
      );
      try { await pushCounterDisplay({ sessionId, counterId }); } catch {}
    }
  }catch{ /* non-fatal */ }
}

export async function createToken({ sessionId, branch, insuranceType, slotId, tokenNo, serviceDate, source='walkin', priority='normal', appointmentId=null, customerId=null, customer=null }){
  const session = await Session.findById(sessionId).lean();
  if (!session) throw new Error('Session not found');
  const day = normalizeToUTCDate(serviceDate || session.serviceDate);
  const token = await Token.create({
    session: sessionId,
    branch: branch || session.branch,
    insuranceType: insuranceType || session.insuranceType,
    slotId,
    tokenNo,
    serviceDate: day,
    source,
    appointmentId,
    customerId,
    customer: customer ? {
      name: customer.name || null,
      nic: customer.nic || null,
      phone: customer.phone || null,
    } : undefined,
    priority,
    timing: { arrivedAt: new Date() }
  });
  await AuditEvent.create({ entityType:'token', entityId: token._id, action:'create', by:null });
  // Fire-and-forget: Notify customer via SMS if phone is available
  (async () => {
    try {
      // Skip here for appointment check-ins; check-in flow sends a tailored SMS
      if (token?.source === 'appointment') return;
      // Determine recipient phone and name
      let phone = token?.customer?.phone || null;
      let name = token?.customer?.name || null;
      if ((!phone || !name) && appointmentId) {
        try {
          const appt = await Appointment.findById(appointmentId).lean();
          phone = phone || appt?.customer?.phone || null;
          name = name || appt?.customer?.name || null;
        } catch {}
      }
      if (!phone) return; // nothing to notify
      const firstName = (name || 'Customer').split(' ')[0];
      const dateStr = new Date(day).toLocaleDateString('en-GB');
      const msg = `Hi ${firstName}, your queue token is ${token.tokenNo} for ${dateStr}. We'll notify you when it's your turn. - ServSync`;
      await enqueueSms({
        to: phone,
        message: msg,
        contact: { name: name || undefined },
        meta: { kind: 'token_created', tokenId: String(token._id), sessionId: String(sessionId), tokenNo: token.tokenNo }
      });
    } catch (e) {
      console.error('[token.service] failed to enqueue token SMS:', e?.message || e);
    }
  })();
  return token;
}

export async function listWaiting({ sessionId, counterId=null, slotId=null, limit=20 }){
  const q = { session: sessionId, status:'waiting' };
  if (counterId) q.currentCounterId = counterId;
  if (slotId) q.slotId = slotId;
  // Sort strictly by arrival time so "return to waiting" (which updates arrivedAt) places token at the end
  return Token.find(q).sort({ 'timing.arrivedAt': 1 }).limit(limit).lean();
}

export async function popNextWaiting({ sessionId, counterId, slotId=null }){
  const now = new Date();
  const q = { session: sessionId, status:'waiting' };
  if (slotId) q.slotId = slotId;
  let token = await Token.findOneAndUpdate(
    q,
    { $set: { status:'called', currentCounterId: counterId, 'timing.firstCallAt': now } },
    { new: true, sort: { tokenNo: 1, 'timing.arrivedAt': 1 } }
  );
  // Fallback: populate missing customer snapshot from appointment if available
  if (token && (!token.customer || (!token.customer.name && !token.customer.nic && !token.customer.phone)) && token.appointmentId){
    try{
      const appt = await Appointment.findById(token.appointmentId).lean();
      if (appt?.customer){
        token = await Token.findByIdAndUpdate(token._id, { $set: { customer: {
          name: appt.customer.name || null,
          nic: appt.customer.nic || null,
          phone: appt.customer.phone || null,
        } } }, { new: true });
      }
    }catch{ /* ignore */ }
  }
  if (token) await AuditEvent.create({ entityType:'token', entityId: token._id, action:'call', by: counterId });
  if (token) {
    try { await pushCounterDisplay({ sessionId, counterId }); } catch {}
  }
  return token;
}

export async function recallToken({ tokenId, counterId }){
  let token = await Token.findByIdAndUpdate(tokenId, { $set: { status:'called', currentCounterId: counterId } }, { new: true });
  // Fallback: populate missing customer snapshot from appointment if available
  if (token && (!token.customer || (!token.customer.name && !token.customer.nic && !token.customer.phone)) && token.appointmentId){
    try{
      const appt = await Appointment.findById(token.appointmentId).lean();
      if (appt?.customer){
        token = await Token.findByIdAndUpdate(token._id, { $set: { customer: {
          name: appt.customer.name || null,
          nic: appt.customer.nic || null,
          phone: appt.customer.phone || null,
        } } }, { new: true });
      }
    }catch{ /* ignore */ }
  }
  if (token) await AuditEvent.create({ entityType:'token', entityId: token._id, action:'recall', by: counterId });
  if (token) {
    try { await pushCounterDisplay({ sessionId: token.session, counterId }); } catch {}
  }
  return token;
}

export async function startService({ tokenId, counterId }){
  const now = new Date();
  const token = await Token.findOneAndUpdate(
    { _id: tokenId, status: { $in: ['called', 'waiting'] } },
    { $set: { status:'serving', 'timing.serviceStartAt': now, currentCounterId: counterId } },
    { new: true }
  );
  if (token) await AuditEvent.create({ entityType:'token', entityId: token._id, action:'start', by: counterId });
  if (token) {
    // Demote any accidental duplicates to waiting so only one token remains SERVING
    await ensureSingleServing({ sessionId: token.session, counterId, keepTokenId: token._id });
    try { await pushCounterDisplay({ sessionId: token.session, counterId }); } catch {}
  }
  return token;
}

export async function endService({ tokenId, counterId }){
  const now = new Date();
  const token = await Token.findOneAndUpdate({ _id: tokenId, status:'serving' }, { $set: { status:'completed', 'timing.endedAt': now } }, { new: true });
  if (token) await AuditEvent.create({ entityType:'token', entityId: token._id, action:'complete', by: counterId });
  if (token) {
    try { await pushCounterDisplay({ sessionId: token.session, counterId }); } catch {}
  }
  // After completion, invite feedback via SMS (fire-and-forget)
  if (token) {
    (async () => {
      try {
        // Resolve contact info from token snapshot or appointment
        let name = token?.customer?.name || null;
        let phone = token?.customer?.phone || null;
        let email = null;
        if ((!name || !phone || !email) && token.appointmentId) {
          try {
            const appt = await Appointment.findById(token.appointmentId).lean();
            if (!name) name = appt?.customer?.name || null;
            if (!phone) phone = appt?.customer?.phone || null;
            email = appt?.customer?.email || null;
          } catch {}
        }
        if (!phone) return; // cannot send without phone
        const firstName = (name || 'Customer').split(' ')[0];
        const link = generateFeedbackLink({ firstName, email: email || '', sessionId: token.session, tokenId: token._id });
        const msg = `Thanks for visiting NITF. Share your feedback: ${link} (valid 48h). — ServSync`;
        await enqueueSms({
          to: phone,
          message: msg,
          contact: { name, email },
          meta: { kind: 'feedback_invite', tokenId: String(token._id), sessionId: String(token.session) }
        });
      } catch (e) {
        console.error('[token.service] failed to enqueue feedback SMS:', e?.message || e);
      }
    })();
  }
  return token;
}

export async function skipToken({ tokenId, counterId }){
  const token = await Token.findByIdAndUpdate(tokenId, { $set: { status:'skipped' }, $inc: { 'meta.skips': 1 } }, { new: true });
  if (token) await AuditEvent.create({ entityType:'token', entityId: token._id, action:'skip', by: counterId });
  if (token) {
    try { await pushCounterDisplay({ sessionId: token.session, counterId }); } catch {}
  }
  return token;
}

export async function transferToken({ tokenId, toCounterId, byCounterId }){
  const token = await Token.findByIdAndUpdate(tokenId, { $set: { status:'waiting', currentCounterId: toCounterId }, $inc: { 'meta.transferCount': 1 } }, { new: true });
  if (token) await AuditEvent.create({ entityType:'token', entityId: token._id, action:'transfer', by: byCounterId, diff: { toCounterId } });
  if (token) {
    try {
      if (byCounterId) await pushCounterDisplay({ sessionId: token.session, counterId: byCounterId });
      if (toCounterId) await pushCounterDisplay({ sessionId: token.session, counterId: toCounterId });
    } catch {}
  }
  return token;
}

export async function getCurrentToken({ tokenId, sessionId, counterId }){
  if (tokenId) {
    return Token.findById(tokenId).lean();
  }
  // Prefer a token currently being served at this counter, else the last called token
  const serving = await Token.findOne({ session: sessionId, currentCounterId: counterId, status: 'serving' }).sort({ 'timing.serviceStartAt': -1 }).lean();
  if (serving) return serving;
  const called = await Token.findOne({ session: sessionId, currentCounterId: counterId, status: 'called' }).sort({ 'timing.firstCallAt': -1 }).lean();
  return called;
}

export async function listBySession({ sessionId, slotId=null, statuses=undefined }){
  const q = { session: sessionId };
  if (slotId) q.slotId = slotId;
  if (Array.isArray(statuses) && statuses.length) q.status = { $in: statuses };
  return Token.find(q).sort({ 'timing.arrivedAt': 1 }).lean();
}

export async function returnToWaiting({ tokenId }){
  const now = new Date();
  // capture previous counter before clearing
  const prev = await Token.findById(tokenId).lean();
  const token = await Token.findByIdAndUpdate(tokenId, { $set: { status: 'waiting', 'timing.arrivedAt': now, currentCounterId: null } }, { new: true });
  if (token) await AuditEvent.create({ entityType:'token', entityId: token._id, action:'return_to_waiting' });
  if (prev?.currentCounterId) {
    try { await pushCounterDisplay({ sessionId: token.session, counterId: prev.currentCounterId }); } catch {}
  }
  return token;
}
