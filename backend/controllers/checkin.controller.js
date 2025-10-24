// src/controllers/checkin.controller.js
import Appointment from '../models/appointment.model.js';
import Session from '../models/session.model.js';
import { verifyAppointmentQR } from '../services/qr.service.js';
import { createToken } from '../services/token.service.js';
import { getNextTokenNo, normalizeToUTCDate } from '../services/tokenNumber.service.js';
import InsuranceType from '../models/insuranceType.model.js';
import Branch from '../models/branch.model.js';
import { enqueueSms } from '../services/sms.service.js';

export async function checkin(req, res){
  try {
    console.log('Check-in request body:', req.body);
    console.log('Session data:', req.session);
    
    const { qrToken, bookingCode, counterId, isOverride, overrideReason } = req.body || {};
    let code = bookingCode;
    if (qrToken) {
      const payload = verifyAppointmentQR(qrToken);
      code = payload.bookingCode;
    }
    if (!code) return res.status(400).send('bookingCode or qrToken required');

    const appt = await Appointment.findOne({ bookingCode: code });
    if (!appt) return res.status(404).send('Appointment not found');
    if (appt.status === 'cancelled') return res.status(409).send('Appointment cancelled');
    if (appt.status === 'checked_in') return res.status(200).json({ message: 'Already checked in' });

    const session = await Session.findById(appt.sessionId).lean();
    if (!session) return res.status(404).send('Session not found');

  // Validation checks (can be overridden by staff)
    let validationErrors = [];
    
  // Check if staff has branch context and appointment is for same branch
  const staffBranchId = req.session?.staff?.branchId;
  const staffName = req.session?.staff?.userName || req.session?.staffNic || null;
    if (staffBranchId && String(appt.branchId) !== String(staffBranchId)) {
      validationErrors.push(`This appointment is for a different branch. Staff branch: ${req.session.staff.branchName || 'Unknown'}`);
    }
    
    // Check appointment date (not too old or too far in future)
    const today = new Date();
    const appointmentDate = new Date(session.serviceDate);
    const daysDiff = Math.floor((appointmentDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < -1) {
      validationErrors.push('This appointment was scheduled for a previous day');
    } else if (daysDiff > 0) {
      validationErrors.push('This appointment is scheduled for a future date');
    }
    
    // Check time window (e.g., not too early before appointment time)
    const now = new Date();
    const slot = session.slots?.find(s => String(s.slotId) === String(appt.slotId));
    if (slot?.startTime) {
      // startTime is a Date in Session model
      const slotStart = new Date(slot.startTime);
      const earliestCheckIn = new Date(slotStart.getTime() - 30 * 60 * 1000);
      if (now < earliestCheckIn) {
        validationErrors.push(`Too early to check in. Appointment time: ${slotStart.toISOString()}`);
      }
    }

    // Debug: log validation errors
    console.log('Validation errors:', validationErrors);
    console.log('Staff branch ID:', staffBranchId);
    console.log('Appointment branch ID:', appt.branchId);
    console.log('Appointment date:', appointmentDate);
    console.log('Today:', today);
    console.log('Day difference:', daysDiff);

    // NOTE: For demo / uni project we skip strict validation enforcement here.
    // Log validation errors for audit, but proceed with check-in regardless.
    if (validationErrors.length > 0) {
      console.log(`Validation warnings for check-in (${code}):`, validationErrors);
    }

    // Record override metadata when provided
    if (isOverride) {
      console.log(`Override check-in: ${code}`, {
        staff: staffName || 'Unknown',
        reason: overrideReason,
        errors: validationErrors,
        timestamp: new Date()
      });
      // Optionally persist override log to DB here
    }

    // Generate deterministic token number per branch per day (e.g., A-001)
    const day = normalizeToUTCDate(session.serviceDate);
    let prefix = 'A';
    try {
      const it = await InsuranceType.findById(appt.insuranceTypeId).lean();
      if (it?.nameUpper?.length) prefix = it.nameUpper.charAt(0);
    } catch {}
    const tokenNo = await getNextTokenNo({ branchId: appt.branchId, serviceDate: day, prefix });
    const token = await createToken({
      sessionId: appt.sessionId,
      branch: appt.branchId,
      insuranceType: appt.insuranceTypeId,
      slotId: appt.slotId,
      tokenNo,
      serviceDate: day,
      source: 'appointment',
      appointmentId: appt._id,
      customerId: appt.customer?.userId || null,
      customer: { name: appt.customer?.name, nic: appt.customer?.nic, phone: appt.customer?.phone },
      priority: 'normal',
      isOverride: isOverride || false,
      overrideReason: overrideReason || null,
      overrideBy: staffName
    });

    appt.status = 'checked_in';
    appt.checkedInAt = new Date();
    appt.checkedInBy = staffName;
    appt.isOverride = isOverride || false;
    appt.overrideReason = overrideReason || null;
    await appt.save();

    // Fire-and-forget: enqueue SMS to customer with token and counter info
    (async () => {
      try {
        const phone = appt.customer?.phone || token?.customer?.phone || null;
        if (!phone) return; // no phone, skip

        // Resolve branch & counter name
        let branchName = 'Branch';
        let counterName = 'Counter';
        try {
          const branch = await Branch.findById(appt.branchId).lean();
          if (branch?.name) branchName = branch.name;
          const counter = branch?.counters?.find(c => String(c._id) === String(session.counterId));
          if (counter?.name) counterName = counter.name;
        } catch {}

        const firstName = (appt.customer?.name || 'Customer').split(' ')[0];
        const msg = `Hi ${firstName}, your token ${token.tokenNo} at ${branchName}. Counter ${counterName}. We'll notify you when it's your turn. - ServSync`;

        await enqueueSms({
          to: phone,
          message: msg,
          contact: { name: appt.customer?.name, nic: appt.customer?.nic },
          meta: {
            kind: 'checkin_token',
            tokenId: String(token._id),
            sessionId: String(token.session),
            counterId: String(session.counterId),
            branchId: String(appt.branchId)
          }
        });
      } catch (e) {
        console.error('[checkin] failed to enqueue SMS:', e?.message || e);
      }
    })();

    res.json({ ok: true, token, isOverride: isOverride || false });
  } catch (e) {
    console.error('Check-in error:', e);
    if (e.code === 'QR_INVALID') return res.status(400).send('Invalid QR');
    // Unexpected server error: respond with 500 so clients know it's a server-side failure
    res.status(500).send(e.message || 'Check-in failed');
  }
}
