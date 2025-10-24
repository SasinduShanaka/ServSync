// src/services/tokenNumber.service.js
import TokenCounter from '../models/tokenCounter.model.js';

function normalizeToUTCDate(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Get the next token number string for a branch and date.
 * - Uses an atomic findOneAndUpdate with $inc to bump nextSeq.
 * - Returns like: `${prefix}-${seq.toString().padStart(3,'0')}`
 * - Prefix is optional; default 'A'. You can pass different prefixes if needed per slot.
 */
export async function getNextTokenNo({ branchId, serviceDate, prefix='A', pad=3 }) {
  if (!branchId || !serviceDate) throw new Error('branchId and serviceDate required');
  const day = normalizeToUTCDate(serviceDate);
  const counter = await TokenCounter.findOneAndUpdate(
    { branch: branchId, serviceDate: day },
    { $inc: { nextSeq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  const seq = counter.nextSeq;
  const num = seq.toString().padStart(pad, '0');
  return `${prefix}-${num}`;
}

export { normalizeToUTCDate };
