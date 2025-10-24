// src/routes/appointment.routes.js
import { Router } from 'express';
import { createAppointment, getAppointmentByCode, listMyAppointments, cancelMyAppointment, resendAppointmentSms, listBySessionSlotStaff } from '../controllers/appointment.controller.js';
import Appointment from '../models/appointment.model.js';
import Session from '../models/session.model.js';
import Branch from '../models/branch.model.js';
import InsuranceType from '../models/insuranceType.model.js';
import { listTodayAppointmentsStaff } from '../controllers/appointment.controller.js';
import { staffPreviewHandler } from '../controllers/appointment.controller.js';


const router = Router();

// Require auth middleware in server.js when mounting if needed
router.get('/', (req,res,next)=>{
	if (req.query.mine) return listMyAppointments(req,res,next);
	res.status(400).json({ message: 'Unsupported query' });
});
router.post('/', createAppointment);

// GOOD (specific routes first)
router.get('/staff/today', listTodayAppointmentsStaff);
router.get('/staff/preview/:bookingCode', staffPreviewHandler);
router.get('/staff/by-session-slot', listBySessionSlotStaff);
router.get('/:bookingCode', getAppointmentByCode);      


// Staff-only helper to preview appointment by code (no user session required).
// This route should be mounted under /api/appointments in server.js with requireStaff
// if you want to protect it. For now, it's just exposed here and trust mounting.
// Put all staff routes BEFORE param routes to avoid "/:bookingCode" catching them
router.get('/staff/preview/:bookingCode', async (req, res) => {
	try {
		const { bookingCode } = req.params;
		const appt = await Appointment.findOne({ bookingCode }).lean();
		if (!appt) return res.status(404).json({ message: 'Appointment not found' });
		const [session, branch, insuranceType] = await Promise.all([
			Session.findById(appt.sessionId).lean(),
			Branch.findById(appt.branchId).lean(),
			InsuranceType.findById(appt.insuranceTypeId).lean()
		]);
		const slot = session?.slots?.find(s => String(s.slotId) === String(appt.slotId));
		res.json({ ...appt, session, branch, insuranceType, slot });
	} catch (e) {
		res.status(400).json({ message: e.message || 'Failed to load appointment' });
	}
});


// Get today's appointments for the current branch/staff member
router.get('/staff/today', async (req, res) => {
	try {
		const staffBranchId = req.session?.staff?.branchId;
		if (!staffBranchId) {
			return res.status(400).json({ message: 'Staff branch not set in session' });
		}

		// Determine UTC day for today (sessions use serviceDate normalized to UTC midnight)
		const now = new Date();
		const startUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
		const endUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));

		// Find today's sessions for this branch
		const sessions = await Session.find({
			branch: staffBranchId,
			serviceDate: { $gte: startUTC, $lt: endUTC }
		}).select('_id serviceDate slots').lean();

		if (!sessions.length) return res.json([]);

		const sessionMap = new Map(sessions.map(s => [String(s._id), s]));
		const sessionIds = Array.from(sessionMap.keys());

		// Find appointments belonging to those sessions
		const appointments = await Appointment.find({ sessionId: { $in: sessionIds } })
			.populate('branchId', 'name code')
			.populate('insuranceTypeId', 'name')
			.lean();

		// Attach slot details from the session
		const enhanced = appointments.map(appt => {
			const sess = sessionMap.get(String(appt.sessionId));
			const slot = sess?.slots?.find(s => String(s.slotId) === String(appt.slotId));
			return { ...appt, session: sess ? { _id: sess._id, serviceDate: sess.serviceDate } : null, slot };
		});

		res.json(enhanced);
	} catch (error) {
		console.error('Error fetching today\'s appointments:', error);
		res.status(500).json({ message: 'Failed to fetch today\'s appointments' });
	}
});

// Staff typeahead search by bookingCode, NIC, or phone (recent window), limited and branch-scoped
router.get('/staff/search', async (req, res) => {
	try {
		const q = String(req.query.q || '').trim();
		if (q.length < 2) return res.json([]);

		const staffBranchId = req.session?.staff?.branchId;
		if (!staffBranchId) return res.json([]);

		// Build case-insensitive partial regex safely
		const esc = (s)=> s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const rx = new RegExp(esc(q), 'i');

		// Compute window on sessions by serviceDate (UTC day)
		const now = new Date();
		const fromUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 30));
		const toUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 30));

		const sessions = await Session.find({
			branch: staffBranchId,
			serviceDate: { $gte: fromUTC, $lte: toUTC }
		}).select('_id serviceDate').lean();
		if (!sessions.length) return res.json([]);
		const sessionMap = new Map(sessions.map(s => [String(s._id), s]));
		const sessionIds = Array.from(sessionMap.keys());

		const results = await Appointment.find({
			sessionId: { $in: sessionIds },
			$or: [
				{ bookingCode: rx },
				{ 'customer.nic': rx },
				{ 'customer.phone': rx },
				{ 'customer.name': rx }
			]
		})
		.populate('branchId', 'name code')
		.populate('insuranceTypeId', 'name')
		.sort({ updatedAt: -1 })
		.limit(10)
		.lean();

		// Return minimal fields for suggestions (use session.serviceDate as appointmentDate)
		const mapped = results.map(a => ({
			bookingCode: a.bookingCode,
			customer: { name: a.customer?.name, nic: a.customer?.nic, phone: a.customer?.phone },
			appointmentDate: sessionMap.get(String(a.sessionId))?.serviceDate || null,
			branch: a.branchId ? { _id: a.branchId._id, name: a.branchId.name, code: a.branchId.code } : null,
			insuranceType: a.insuranceTypeId ? { _id: a.insuranceTypeId._id, name: a.insuranceTypeId.name } : null
		}));

		res.json(mapped);
	} catch (error) {
		console.error('Error in staff search:', error);
		res.status(500).json({ message: 'Failed to search appointments' });
	}
});

// Search appointments by customer NIC
router.get('/search-by-nic/:nic', async (req, res) => {
	try {
		const { nic } = req.params;

		// Window: last 7 days to next 30 days by session.serviceDate
		const now = new Date();
		const fromUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 7));
		const toUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 30));

		const sessions = await Session.find({ serviceDate: { $gte: fromUTC, $lte: toUTC } })
			.select('_id serviceDate slots')
			.lean();
		if (!sessions.length) return res.status(404).json({ message: 'No appointments found for this NIC' });
		const sessionMap = new Map(sessions.map(s => [String(s._id), s]));
		const sessionIds = Array.from(sessionMap.keys());

		const appointments = await Appointment.find({
			'customer.nic': nic,
			sessionId: { $in: sessionIds }
		})
		.populate('branchId', 'name address')
		.populate('insuranceTypeId', 'name')
		.sort({ updatedAt: -1 })
		.lean();

		if (!appointments || appointments.length === 0) {
			return res.status(404).json({ message: 'No appointments found for this NIC' });
		}

		const mostRecentAppt = appointments[0];
		const sess = sessionMap.get(String(mostRecentAppt.sessionId));
		const slot = sess?.slots?.find(s => String(s.slotId) === String(mostRecentAppt.slotId));

		res.json({
			...mostRecentAppt,
			session: sess ? { _id: sess._id, serviceDate: sess.serviceDate } : null,
			slot,
			totalFound: appointments.length,
			allAppointments: appointments.length > 1 ? appointments.slice(1, 5).map(a => ({
				...a,
				session: sessionMap.get(String(a.sessionId)) ? { _id: sessionMap.get(String(a.sessionId))._id, serviceDate: sessionMap.get(String(a.sessionId)).serviceDate } : null
			})) : []
		});
	} catch (error) {
		console.error('Error searching by NIC:', error);
		res.status(500).json({ message: 'Failed to search appointments by NIC' });
	}
});

// Staff NIC search (branch-scoped)
router.get('/staff/search-by-nic/:nic', async (req, res) => {
	try {
		const { nic } = req.params;
		const staffBranchId = req.session?.staff?.branchId;
		if (!staffBranchId) return res.status(400).json({ message: 'Staff branch not set in session' });

		const now = new Date();
		const fromUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 7));
		const toUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 30));

		const sessions = await Session.find({
			branch: staffBranchId,
			serviceDate: { $gte: fromUTC, $lte: toUTC }
		}).select('_id serviceDate slots').lean();

		if (!sessions.length) return res.status(404).json({ message: 'No appointments found for this NIC' });
		const sessionMap = new Map(sessions.map(s => [String(s._id), s]));
		const sessionIds = Array.from(sessionMap.keys());

		const appointments = await Appointment.find({
			'customer.nic': nic,
			sessionId: { $in: sessionIds }
		})
		.populate('branchId', 'name address')
		.populate('insuranceTypeId', 'name')
		.sort({ updatedAt: -1 })
		.lean();

		if (!appointments || appointments.length === 0) {
			return res.status(404).json({ message: 'No appointments found for this NIC in your branch' });
		}

		const mostRecentAppt = appointments[0];
		const sess = sessionMap.get(String(mostRecentAppt.sessionId));
		const slot = sess?.slots?.find(s => String(s.slotId) === String(mostRecentAppt.slotId));

		res.json({
			...mostRecentAppt,
			session: sess ? { _id: sess._id, serviceDate: sess.serviceDate } : null,
			slot,
			totalFound: appointments.length
		});
	} catch (error) {
		console.error('Error in staff search-by-nic:', error);
		res.status(500).json({ message: 'Failed to search appointments by NIC' });
	}
});

// Finally, param routes that must come last
router.get('/:bookingCode', getAppointmentByCode);
router.post('/:bookingCode/resend-sms', resendAppointmentSms);
router.post('/:bookingCode/cancel', cancelMyAppointment);


export default router;
