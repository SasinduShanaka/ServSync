// src/controllers/session.controller.js
import { createSessionService, listSessionsService, updateSessionService, findSessionByIdService, controlSessionService, deleteSessionsService } from '../services/session.service.js';
import Token from '../models/token.model.js';
import mongoose from 'mongoose';

export const createSession = async (req,res,next)=>{
  try{
    const doc = await createSessionService(req.body);
    res.status(201).json(doc);
  }catch(e){ next(e); }
};

export const listSessions = async (req,res,next)=>{
  try{
    const { branchId, date, counterId, insuranceTypeId } = req.query; // date = 'YYYY-MM-DD'
    const list = await listSessionsService({ branchId, date, counterId, insuranceTypeId });
    res.json(list);
  }catch(e){ next(e); }
};

export const updateSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const doc = await updateSessionService(sessionId, req.body);
    res.json(doc);
  } catch (e) { next(e); }
};

export const getSessionById = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const doc = await findSessionByIdService(sessionId);
    if (!doc) return res.status(404).json({ message: 'Session not found' });

    // Enrich with dynamic metrics (arrived per slot, waiting, served, oldest waiting)
    try {
      const sid = new mongoose.Types.ObjectId(String(sessionId));
      const [waitingCount, servedCount, oldestWaitingDoc, arrivedBySlotAgg, avgWaitAgg, avgServiceAgg] = await Promise.all([
        Token.countDocuments({ session: sid, status: 'waiting' }),
        Token.countDocuments({ session: sid, status: 'completed' }),
        Token.findOne({ session: sid, status: 'waiting' }).sort({ 'timing.arrivedAt': 1 }).select('timing.arrivedAt').lean(),
        Token.aggregate([
          { $match: { session: sid } },
          { $group: { _id: '$slotId', count: { $sum: 1 } } }
        ]),
        // Average wait time (seconds) for tokens currently waiting = now - arrivedAt
        Token.aggregate([
          { $match: { session: sid, status: 'waiting' } },
          { $group: { _id: null, avg: { $avg: { $divide: [ { $subtract: ['$$NOW', '$timing.arrivedAt'] }, 1000 ] } } } }
        ]),
        // Average service time (seconds) for completed tokens = endedAt - serviceStartAt
        Token.aggregate([
          { $match: { session: sid, status: 'completed', 'timing.serviceStartAt': { $exists: true }, 'timing.endedAt': { $exists: true } } },
          { $group: { _id: null, avg: { $avg: { $divide: [ { $subtract: ['$timing.endedAt', '$timing.serviceStartAt'] }, 1000 ] } } } }
        ])
      ]);

      const arrivedBySlot = {};
      for (const row of arrivedBySlotAgg) {
        arrivedBySlot[String(row._id)] = row.count;
      }

      const oldestWaitSec = oldestWaitingDoc?.timing?.arrivedAt ? Math.max(0, Math.floor((Date.now() - new Date(oldestWaitingDoc.timing.arrivedAt).getTime()) / 1000)) : 0;
      const avgWaitSec = Array.isArray(avgWaitAgg) && avgWaitAgg.length ? Math.max(0, Math.floor(avgWaitAgg[0].avg || 0)) : 0;
      const avgServiceSec = Array.isArray(avgServiceAgg) && avgServiceAgg.length ? Math.max(0, Math.floor(avgServiceAgg[0].avg || 0)) : 0;

      doc.metrics = {
        ...(doc.metrics || {}),
        waitingCount,
        servedCount,
        oldestWaitSec,
        arrivedBySlot,
        avgWaitSec,
        avgServiceSec
      };
    } catch (err) {
      // Non-fatal; return base doc if metrics fail
      // eslint-disable-next-line no-console
      console.warn('metrics enrichment failed:', err?.message || err);
    }

    res.json(doc);
  } catch (e) { next(e); }
};

export const controlSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { action, override, slotId } = req.body || {};
    const actor = req.session?.staffNic || 'system';
    const doc = await controlSessionService(sessionId, action, { override, by: actor, slotId });
    res.json(doc);
  } catch (e) { next(e); }
};

export const deleteSessionsByCriteria = async (req, res, next) => {
  try {
    const { branchId, date, insuranceTypeId } = req.query;
    if (!branchId || !date || !insuranceTypeId) return res.status(400).json({ message: 'branchId, date, insuranceTypeId are required' });
    const deleted = await deleteSessionsService({ branchId, date, insuranceTypeId });
    res.json({ deleted });
  } catch (e) { next(e); }
};
