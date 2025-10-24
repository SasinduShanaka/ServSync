// src/controllers/appointment.controller.js
import { createAppointmentService, findAppointmentByCodeService, cancelAppointmentService, enqueueAppointmentSms, sendAppointmentSms, sendCancellationSms } from '../services/appointment.service.js';
import { signAppointmentQR } from '../services/qr.service.js';
import SmsLog from '../models/smsLog.model.js';
import Appointment from '../models/appointment.model.js';
import Session from '../models/session.model.js';
import Branch from '../models/branch.model.js';
import InsuranceType from '../models/insuranceType.model.js';

export async function createAppointment(req, res) {
  try {
    const { sessionId, slotId, branchId, insuranceTypeId, customer, documents } = req.body;
    // Do not set customer.userId from NIC; it expects a Mongo ObjectId. We'll rely on provided NIC in customer.nic.
    const payload = { sessionId, slotId, branchId, insuranceTypeId, customer: { ...customer }, documents };
    const appt = await createAppointmentService(payload);
    const qrToken = signAppointmentQR({ appointmentId: appt._id, bookingCode: appt.bookingCode });
    const base = process.env.APP_BASE_URL || 'http://localhost:5173';
    const summaryUrl = `${base}/appointments/${encodeURIComponent(appt.bookingCode)}`;

    // Send detailed SMS with appointment information
    const phone = customer?.phone || '';
    if (phone) {
      try {
        // Fetch additional details for comprehensive SMS
        const [session, branch, insuranceType] = await Promise.all([
          Session.findById(appt.sessionId).lean(),
          Branch.findById(appt.branchId).lean(),
          InsuranceType.findById(appt.insuranceTypeId).lean()
        ]);

        // Send detailed SMS immediately
        await sendAppointmentSms({
          appointment: appt,
          session,
          branch,
          insuranceType,
          baseUrl: base
        });
        
        console.log(`[Appointment] SMS sent for booking ${appt.bookingCode}`);
      } catch (smsError) {
        console.error(`[Appointment] SMS failed for booking ${appt.bookingCode}:`, smsError.message);
        // Don't fail the appointment creation due to SMS issues
      }
    }

    res.status(201).json({ appointmentId: appt._id, bookingCode: appt.bookingCode, qrToken, summaryUrl });
  } catch (e) {
    if (e.code === 'SLOT_FULL') return res.status(409).send('Slot full');
    res.status(400).send(e.message || 'Failed to create appointment');
  }
}

export async function getAppointmentByCode(req, res) {
  try {
    const { bookingCode } = req.params;
    const appt = await findAppointmentByCodeService(bookingCode);
    
    // Fetch additional details for comprehensive display
    const [session, branch, insuranceType] = await Promise.all([
      Session.findById(appt.sessionId).lean(),
      Branch.findById(appt.branchId).lean(),
      InsuranceType.findById(appt.insuranceTypeId).lean()
    ]);

    // Find the specific slot details
    const slot = session?.slots?.find(s => s.slotId.toString() === appt.slotId.toString());

    // Return enriched appointment data
    res.json({
      ...appt,
      session,
      branch,
      insuranceType,
      slot
    });
  } catch (e) {
    res.status(404).send(e.message || 'Not found');
  }
}

export async function listMyAppointments(req, res){
  try{
    // Identify current user by session nic (nicOrPassport)
    const nic = req.session?.nic;
    if (!nic) return res.status(401).json({ message: 'Not logged in' });
    const list = await Appointment.find({ 'customer.nic': nic }).sort({ createdAt: -1 }).lean();
    const base = process.env.APP_BASE_URL || 'http://localhost:5173';
    
    // Enrich appointments with session, branch, and insurance details
    const enriched = await Promise.all(list.map(async (appt) => {
      const [session, branch, insuranceType] = await Promise.all([
        Session.findById(appt.sessionId).lean(),
        Branch.findById(appt.branchId).lean(),
        InsuranceType.findById(appt.insuranceTypeId).lean()
      ]);

      // Find the specific slot details
      const slot = session?.slots?.find(s => s.slotId.toString() === appt.slotId.toString());

      return {
        ...appt,
        session,
        branch,
        insuranceType,
        slot,
        summaryUrl: `${base}/appointments/${encodeURIComponent(appt.bookingCode)}`,
        qrToken: signAppointmentQR({ appointmentId: appt._id, bookingCode: appt.bookingCode })
      };
    }));
    
    res.json(enriched);
  }catch(e){
    res.status(500).json({ message: e.message || 'Failed to load appointments' });
  }
}

export async function cancelMyAppointment(req, res){
  try{
    const nic = req.session?.nic;
    if (!nic) return res.status(401).json({ message: 'Not logged in' });
    const { bookingCode } = req.params;
    
    // Get appointment details before cancellation for SMS
    const appointment = await Appointment.findOne({ bookingCode, 'customer.nic': nic, status: 'booked' }).lean();
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found or not cancellable' });
    }
    
    const result = await cancelAppointmentService({ bookingCode, nic });
    
    // Send cancellation SMS
    try {
      await sendCancellationSms({ appointment, reason: 'by customer request' });
      console.log(`[Appointment] Cancellation SMS sent for booking ${bookingCode}`);
    } catch (smsError) {
      console.error(`[Appointment] Cancellation SMS failed for booking ${bookingCode}:`, smsError.message);
      // Don't fail the cancellation due to SMS issues
    }
    
    res.json(result);
  }catch(e){
    res.status(e.status || 400).json({ message: e.message || 'Failed to cancel' });
  }
}

export async function resendAppointmentSms(req, res){
  try{
    const nic = req.session?.nic;
    if (!nic) return res.status(401).json({ message: 'Not logged in' });
    const { bookingCode } = req.params;
    const appt = await Appointment.findOne({ bookingCode, 'customer.nic': nic }).lean();
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    const base = process.env.APP_BASE_URL || 'http://localhost:5173';
    await enqueueAppointmentSms({ appointment: appt, baseUrl: base });
    res.json({ ok: true });
  }catch(e){
    res.status(400).json({ message: e.message || 'Failed to enqueue SMS' });
  }
}

export async function listTodayAppointmentsStaff(req, res) {
  try {
    const { branchId, insuranceTypeId } = req.query;
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const end   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));

    // find today’s sessions for branch / insurance filters
    const sessionFilter = { serviceDate: { $gte: start, $lt: end } };
    if (branchId) sessionFilter.branch = branchId;
    if (insuranceTypeId) sessionFilter.insuranceType = insuranceTypeId;

    const sessions = await Session.find(sessionFilter).lean();
    const sessionIds = sessions.map(s => s._id);
    if (!sessionIds.length) return res.json({ items: [] });

    // pull all appointments for those sessions
    const appts = await Appointment.find({ sessionId: { $in: sessionIds } }).lean();

    // enrich with session/slot/branch/insuranceType
    const branchIds = [...new Set(appts.map(a => String(a.branchId)))];
    const insIds    = [...new Set(appts.map(a => String(a.insuranceTypeId)))];
    const [branches, insTypes] = await Promise.all([
      Branch.find({ _id: { $in: branchIds } }).lean(),
      InsuranceType.find({ _id: { $in: insIds } }).lean()

      
    ]);

    const bMap = Object.fromEntries(branches.map(b => [String(b._id), b]));
    const iMap = Object.fromEntries(insTypes.map(i => [String(i._id), i]));
    const sMap = Object.fromEntries(sessions.map(s => [String(s._id), s]));

    const items = appts.map(a => {
      const s = sMap[String(a.sessionId)];
      const slot = s?.slots?.find(x => String(x.slotId) === String(a.slotId)) || null;
      return {
        ...a,
        session: s || null,
        branch: bMap[String(a.branchId)] || null,
        insuranceType: iMap[String(a.insuranceTypeId)] || null,
        slot
      };
    });

    // sort by start time (if available), otherwise createdAt
    items.sort((x, y) => {
      const xs = x?.slot?.startTime ? new Date(x.slot.startTime).getTime() : 0;
      const ys = y?.slot?.startTime ? new Date(y.slot.startTime).getTime() : 0;
      return xs - ys || (new Date(x.createdAt) - new Date(y.createdAt));
    });

    res.json({ items });
  } catch (e) {
    res.status(400).json({ message: e.message || 'Failed to load today appointments' });
  }
}

export async function listBySessionSlotStaff(req, res){
  try{
    const { sessionId, slotId, statuses } = req.query;
    if (!sessionId || !slotId) return res.status(400).json({ message: 'sessionId and slotId are required' });
    const statusArr = statuses ? String(statuses).split(',').filter(Boolean) : ['booked'];
    const items = await Appointment.find({ sessionId, slotId, status: { $in: statusArr } }).lean();
    res.json({ items });
  }catch(e){ res.status(400).json({ message: e.message || 'Failed to list appointments' }); }
}


export const staffPreviewHandler = async (req, res) => {
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};