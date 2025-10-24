import { Router } from 'express';
import Session from '../models/session.model.js';
import Feedback from '../models/Feedback.models.js';
import crypto from 'crypto';

const router = Router();

// Create an invite for a session. Returns a short-lived token and session meta.
// Frontend can call this to get an invite link to share with customers.
router.post('/session/:id/invite', async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Session.findById(id).select('branch counterId insuranceType serviceDate slots status');
  if (!session) return res.status(404).json({ error: true, message: 'Session not found' });

    // Create a simple token (not JWT) — short random hex string with expiry timestamp
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = Date.now() + (1000 * 60 * 60 * 24); // 24 hours

    // In a production app you'd persist tokens to DB and send via email/SMS.
    // For now return token and a friendly invite link pattern the frontend can consume.
    const invite = {
      token,
      expiresAt,
      link: `/feedback/invite/${token}?session=${id}`,
      session: {
        id: session._id,
        branch: session.branch,
        counterId: session.counterId,
        insuranceType: session.insuranceType,
        serviceDate: session.serviceDate,
        status: session.status
      }
    };

    res.json(invite);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message || 'Failed to create invite' });
  }
});

// Public endpoint to submit feedback. Accepts { username, email, message, rating, sessionId?, token? }
router.post('/submit', async (req, res) => {
  try {
    const { username, email, message, rating, sessionId } = req.body;
  if (!message || typeof message !== 'string') return res.status(400).json({ error: true, message: 'Message is required' });

    const fb = new Feedback({ username, email, message, rating });
    if (sessionId) fb.session = sessionId; // optional linkage
    await fb.save();
    res.json({ success: true, feedback: fb });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message || 'Failed to submit feedback' });
  }
});

export default router;
