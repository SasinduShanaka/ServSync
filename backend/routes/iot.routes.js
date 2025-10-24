import { Router } from 'express';
import { buildDisplayState } from '../realtime/socket.js';
import Session from '../models/session.model.js';

const router = Router();

// Public endpoint for ESP32 or kiosk displays to poll current counter state
// GET /api/iot/display?sessionId=...&counterId=...
router.get('/display', async (req, res) => {
  try {
    let { sessionId, counterId, branchId, date } = req.query || {};
    if (!counterId) return res.status(400).json({ message: 'counterId is required' });

    // Convenience: allow branch/date lookup if sessionId is not provided
    if (!sessionId && branchId && date) {
      try {
        const serviceDay = new Date(`${date}T00:00:00.000Z`);
        const sess = await Session.findOne({ branch: branchId, counterId, serviceDate: serviceDay }).select('_id').lean();
        if (sess) sessionId = String(sess._id);
      } catch {}
    }

    if (!sessionId) {
      // Return a benign payload so IoT clients can still render a friendly message
      return res.json({
        error: 'session_not_found',
        sessionId: null,
        counterId: String(counterId),
        slot: { state: 'idle' },
        current: null,
        next: null,
        queue: { waitingCount: 0, servedCount: 0, avgServiceSec: null }
      });
    }

    const payload = await buildDisplayState({ sessionId, counterId });
    return res.json(payload);
  } catch (e) {
    return res.status(500).json({ message: e?.message || 'failed_to_build_display_state' });
  }
});

export default router;
