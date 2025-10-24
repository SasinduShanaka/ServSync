// src/services/feedbackLink.service.js
import jwt from 'jsonwebtoken';

const SECRET = process.env.FEEDBACK_TOKEN_SECRET || 'dev-feedback-secret';
const TTL_HOURS = Number(process.env.FEEDBACK_TOKEN_TTL_HOURS || 48);
const FRONTEND_ORIGIN = process.env.FRONTEND_PUBLIC_ORIGIN || 'http://localhost:5173';

export function signFeedbackToken({ firstName, email = '', sessionId = null, tokenId = null }, ttlHours = TTL_HOURS) {
  const payload = {
    fn: firstName || 'Customer',
    em: email || '',
    sid: sessionId || null,
    tid: tokenId || null
  };
  const opts = { expiresIn: `${ttlHours}h` };
  return jwt.sign(payload, SECRET, opts);
}

export function generateFeedbackLink({ firstName, email = '', sessionId = null, tokenId = null }) {
  const token = signFeedbackToken({ firstName, email, sessionId, tokenId });
  return `${FRONTEND_ORIGIN}/feedback?ft=${encodeURIComponent(token)}`;
}

// Optional: verify and decode (not used by client now, but handy if you add server-side redeem)
export function verifyFeedbackToken(token) {
  try { return jwt.verify(token, SECRET); } catch { return null; }
}
