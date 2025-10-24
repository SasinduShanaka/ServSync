// src/services/sms.service.js
import SmsLog from '../models/smsLog.model.js';
import { sendSms } from './notify.service.js';

// Normalize a phone number to Notify.lk format: 94XXXXXXXXX (Sri Lanka mobile)
// Accepts: 07XXXXXXXX, +94XXXXXXXXX, 94XXXXXXXXX
// Returns: 94XXXXXXXXX or null if invalid
export function normalizePhoneForNotify(input) {
  if (!input) return null;
  let s = String(input).trim();
  if (!s) return null;
  // keep digits and plus
  s = s.replace(/[^0-9+]/g, '');
  if (!s) return null;
  // strip leading '+' or international '00'
  if (s.startsWith('+')) s = s.slice(1);
  if (s.startsWith('00')) s = s.slice(2);
  // if local mobile format 0XXXXXXXXX -> 94XXXXXXXXX
  if (s.startsWith('0') && s.length === 10) {
    s = '94' + s.slice(1);
  }
  // already in 94XXXXXXXXX format?
  if (/^94\d{9}$/.test(s)) return s;
  return null;
}

/**
 * Queue an SMS to be sent by the background worker.
 * - Non-blocking: does not call external providers directly
 * - Retries with exponential backoff handled by sms.worker
 */
export async function enqueueSms({ to, message, contact = {}, meta = {} }) {
  const phone = normalizePhoneForNotify(to);
  if (!phone) {
    console.warn('[sms.service] invalid phone, skipping enqueue:', to);
    return null;
  }
  if (!message) return null;
  try {
    const log = await SmsLog.create({
      to: phone,
      message: message.trim(),
      contact,
      meta: { ...meta, source: meta.source || 'system' },
      // status defaults to 'queued' and will be picked by worker
    });
    return log;
  } catch (e) {
    // Do not throw to avoid breaking main flow
    console.error('[sms.service] enqueue failed:', e?.message || e);
    return null;
  }
}

/**
 * Send an SMS immediately (synchronously) and persist the attempt.
 * - Blocks on provider request; use sparingly in user-facing paths.
 * - If provider fails, the log is marked failed.
 */
export async function sendSmsNow({ to, message, contact = {}, meta = {} }) {
  const phone = normalizePhoneForNotify(to);
  if (!phone) throw new Error('Invalid phone number');
  if (!message) throw new Error('Message is required');

  const smsLog = new SmsLog({
    to: phone,
    message: message.trim(),
    contact,
    meta: { ...meta, source: meta.source || 'system' },
    status: 'processing'
  });
  await smsLog.save();

  try {
    const result = await sendSms({ to: phone, message: message.trim(), contact });
    await SmsLog.findByIdAndUpdate(smsLog._id, { $set: { status: 'sent', providerResponse: result, lastError: '' } });
    return { success: true, result };
  } catch (err) {
    await SmsLog.findByIdAndUpdate(smsLog._id, { $set: { status: 'failed', lastError: err?.message || String(err) } });
    throw err;
  }
}
