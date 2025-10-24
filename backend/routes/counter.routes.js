import { Router } from 'express';
import TokenCounter from '../models/tokenCounter.model.js';
import { normalizeToUTCDate } from '../services/tokenNumber.service.js';

const router = Router();

// GET /api/counters?branchId=&from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/', async (req, res) => {
  try {
    const { branchId, from, to } = req.query;
    const q = {};
    if (branchId) q.branch = branchId;
    if (from || to) {
      q.serviceDate = {};
      if (from) q.serviceDate.$gte = normalizeToUTCDate(from);
      if (to) {
        const end = normalizeToUTCDate(to);
        q.serviceDate.$lte = end;
      }
    }
    const items = await TokenCounter.find(q).sort({ serviceDate: -1 }).lean();
    res.json({ counters: items });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// POST /api/counters/reset { branchId, serviceDate, nextSeq }
router.post('/reset', async (req, res) => {
  try {
    const { branchId, serviceDate, nextSeq = 0 } = req.body || {};
    if (!branchId || !serviceDate) return res.status(400).json({ message: 'branchId and serviceDate required' });
    const day = normalizeToUTCDate(serviceDate);
    const doc = await TokenCounter.findOneAndUpdate(
      { branch: branchId, serviceDate: day },
      { $set: { nextSeq } },
      { upsert: true, new: true }
    );
    res.json(doc);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

export default router;
