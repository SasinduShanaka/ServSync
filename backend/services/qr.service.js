// src/services/qr.service.js
import jwt from 'jsonwebtoken';

const SECRET = process.env.QR_TOKEN_SECRET || 'dev_qr_secret_change_me';

export function signAppointmentQR({ appointmentId, bookingCode, expiresIn = '2d' }){
  return jwt.sign({ t: 'appt', appointmentId, bookingCode }, SECRET, { expiresIn });
}

export function verifyAppointmentQR(token){
  try {
    const payload = jwt.verify(token, SECRET);
    if (payload?.t !== 'appt') throw new Error('Invalid type');
    return payload;
  } catch (e) {
    const err = new Error('Invalid or expired QR token');
    err.code = 'QR_INVALID';
    throw err;
  }
}
