import { Server } from 'socket.io';
import Session from '../models/session.model.js';
import Token from '../models/token.model.js';

let ioInstance = null;

const DEFAULT_ALLOWED_ORIGINS = [
  process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
];

function roomKey({ sessionId, counterId }){
  return `display:${sessionId}:${counterId}`;
}

export function attachSocketServer(httpServer){
  if (ioInstance) return ioInstance;
  ioInstance = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (DEFAULT_ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
        return cb(null, true); // allow all for prototype; tighten in production
      },
      credentials: true,
    },
    path: '/socket.io',
  });

  ioInstance.on('connection', async (socket) => {
    try {
      const { sessionId, counterId } = socket.handshake.query || {};
      if (sessionId && counterId){
        socket.join(roomKey({ sessionId, counterId }));
        const state = await buildDisplayState({ sessionId, counterId });
        socket.emit('display:update', state);
      }
    } catch {}

    socket.on('subscribeDisplay', async ({ sessionId, counterId }) => {
      if (!sessionId || !counterId) return;
      socket.join(roomKey({ sessionId, counterId }));
      const state = await buildDisplayState({ sessionId, counterId });
      socket.emit('display:update', state);
    });

    socket.on('disconnect', () => {
      // no-op
    });
  });

  return ioInstance;
}

export async function buildDisplayState({ sessionId, counterId }){
  const session = await Session.findById(sessionId).lean();
  if (!session) return { error: 'session_not_found' };

  const now = Date.now();
  const activeSlot = session.activeSlotId ? (session.slots || []).find(s => String(s.slotId) === String(session.activeSlotId)) : null;

  let slotState = 'idle';
  let slotStartTime = null;
  let slotEndTime = null;
  let slotRemainingMs = null;

  if (activeSlot){
    slotStartTime = activeSlot.startTime;
    slotEndTime = activeSlot.endTime;
    const start = new Date(activeSlot.startTime).getTime();
    const end = new Date(activeSlot.endTime).getTime();
    // Robust state calculation: if the session is marked RUNNING, treat slot as running even if we're slightly before start
    if (session.status === 'RUNNING' || session.status === 'started') {
      slotState = (now > end) ? 'ended' : 'running';
    } else if (now < start) {
      slotState = 'prestart';
    } else if (now >= start && now <= end) {
      slotState = 'paused';
    } else {
      slotState = 'ended';
    }
    if (now <= end) slotRemainingMs = Math.max(0, end - Math.max(now, start));
  }

  // current: strictly prefer a SERVING token for this counter; else fall back to the most recent CALLED
  const servingNow = await Token.findOne({ session: sessionId, currentCounterId: counterId, status: 'serving' })
    .sort({ 'timing.serviceStartAt': -1 })
    .lean();
  const calledLast = servingNow ? null : await Token.findOne({ session: sessionId, currentCounterId: counterId, status: 'called' })
    .sort({ 'timing.firstCallAt': -1 })
    .lean();
  const current = servingNow || calledLast || null;

  // next waiting within active slot
  const next = await Token.findOne({ session: sessionId, slotId: session.activeSlotId || null, status: 'waiting' })
    .sort({ 'timing.arrivedAt': 1 })
    .lean();

  const waitingCount = await Token.countDocuments({ session: sessionId, slotId: session.activeSlotId || null, status: 'waiting' });
  const servedCount = session?.metrics?.servedCount ?? await Token.countDocuments({ session: sessionId, status: 'completed' });

  // Timer calculation for current serving token
  let timerTargetMs = null;
  let timerRemainingMs = null;
  if (current?.status === 'serving' && activeSlot){
    const totalMs = new Date(activeSlot.endTime).getTime() - new Date(activeSlot.startTime).getTime();
    const arrivedCount = await Token.countDocuments({ session: sessionId, slotId: activeSlot.slotId });
    const perMs = arrivedCount > 0 ? Math.floor(totalMs / arrivedCount) : 0;
    timerTargetMs = perMs || 10*60*1000; // default 10 minutes if not computable
    const startAt = current?.timing?.serviceStartAt ? new Date(current.timing.serviceStartAt).getTime() : Date.now();
    timerRemainingMs = Math.max(0, timerTargetMs - (Date.now() - startAt));
  }

  return {
    sessionId: String(sessionId),
    counterId: String(counterId),
    slot: activeSlot ? {
      startTime: slotStartTime,
      endTime: slotEndTime,
      state: slotState,
      remainingMs: slotRemainingMs,
    } : { state: 'idle' },
    current: current ? {
      tokenNo: current.tokenNo,
      name: current?.customer?.name || '—',
      status: current.status,
      startedAt: current?.timing?.serviceStartAt || null,
      timerTargetMs,
      timerRemainingMs,
    } : null,
    next: next ? {
      tokenNo: next.tokenNo,
      name: next?.customer?.name || '—',
    } : null,
    queue: {
      waitingCount,
      servedCount,
      avgServiceSec: session?.metrics?.avgServiceSec ?? null,
    },
  };
}

export async function pushCounterDisplay({ sessionId, counterId }){
  if (!ioInstance) return;
  const payload = await buildDisplayState({ sessionId, counterId });
  ioInstance.to(roomKey({ sessionId, counterId })).emit('display:update', payload);
}
