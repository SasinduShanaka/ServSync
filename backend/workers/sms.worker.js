// src/workers/sms.worker.js
import SmsLog from '../models/smsLog.model.js';
import { sendSms } from '../services/notify.service.js';
import { normalizePhoneForNotify } from '../services/sms.service.js';

const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 30_000; // 30s base; exponential backoff

function backoffMs(attempt) {
  return Math.min(10 * 60_000, BASE_DELAY_MS * Math.pow(2, Math.max(0, attempt - 1))); // cap at 10min
}

export function startSmsWorker({ intervalMs = 5_000 } = {}) {
  let timer = null;
  const tick = async () => {
    try {
      // Fetch one pending job ready to attempt
      const job = await SmsLog.findOneAndUpdate(
        { status: { $in: ['queued', 'retrying'] }, nextAttemptAt: { $lte: new Date() } },
        { $set: { status: 'processing' } },
        { sort: { createdAt: 1 }, new: true }
      );

      if (!job) return; // nothing to do this tick

      try {
        const phone = normalizePhoneForNotify(job.to);
        if (!phone) {
          throw new Error('Invalid phone number for provider');
        }
        const response = await sendSms({ to: phone, message: job.message, contact: job.contact });
        await SmsLog.findByIdAndUpdate(job._id, { $set: { status: 'sent', providerResponse: response, lastError: '' } });
      } catch (err) {
        const attempts = job.attempts + 1;
        const canRetry = attempts < MAX_ATTEMPTS;
        const delay = backoffMs(attempts);
        await SmsLog.findByIdAndUpdate(job._id, {
          $set: {
            status: canRetry ? 'retrying' : 'failed',
            lastError: err?.message || String(err),
            nextAttemptAt: canRetry ? new Date(Date.now() + delay) : new Date()
          },
          $inc: { attempts: 1 }
        });
      }
    } catch (e) {
      // swallow worker-level errors, log to console for now
      console.error('SMS worker tick error:', e?.message || e);
    }
  };

  const start = () => {
    if (timer) return;
    timer = setInterval(tick, intervalMs);
    console.log(`[sms-worker] started, interval=${intervalMs}ms`);
  };
  const stop = () => {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
    console.log('[sms-worker] stopped');
  };

  // run one tick immediately to reduce initial latency
  tick();
  start();

  return { stop };
}
