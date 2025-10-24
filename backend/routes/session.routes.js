// src/routes/session.routes.js
import { Router } from 'express';
import { createSession, listSessions, updateSession, getSessionById, controlSession, deleteSessionsByCriteria } from '../controllers/session.Controller.js';
import Token from '../models/token.model.js';
import Session from '../models/session.model.js';
import mongoose from 'mongoose';
const router = Router();

router.post('/', /*auth('MANAGER|ADMIN'),*/ createSession);
router.get('/', /*auth(),*/ listSessions);
router.delete('/', /*auth('ADMIN'),*/ deleteSessionsByCriteria);
router.patch('/:sessionId', /*auth('MANAGER|ADMIN'),*/ updateSession);
router.get('/:sessionId', /*auth(),*/ getSessionById);
router.post('/:sessionId/control', /*auth('MANAGER|ADMIN|CCO'),*/ controlSession);

// Staff helper: arrived counts by slot for a session
router.get('/:sessionId/arrivals', async (req, res) => {
	try {
		const { sessionId } = req.params;
		const sid = new mongoose.Types.ObjectId(String(sessionId));
		const agg = await Token.aggregate([
			{ $match: { session: sid } },
			{ $group: { _id: '$slotId', count: { $sum: 1 } } }
		]);
		const map = {}; agg.forEach(r => { map[String(r._id)] = r.count; });
		const sess = await Session.findById(sid).select('slots').lean();
		res.json({ sessionId, slots: (sess?.slots||[]).map(s => ({ slotId: s.slotId, startTime: s.startTime, endTime: s.endTime, capacity: s.capacity, arrived: map[String(s.slotId)] || 0 })) });
	} catch (e) { res.status(400).json({ message: e.message || 'Failed to compute arrivals' }); }
});

export default router;
