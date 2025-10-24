import { Router } from 'express';
import { getQueueSummary, getQueueReport, getQueueDetails } from '../controllers/analytics.controller.js';

const router = Router();

// GET /api/analytics/queue/summary?sessionId=... OR &branchId=&counterId=&insuranceTypeId=&date=YYYY-MM-DD
router.get('/queue/summary', getQueueSummary);
router.get('/queue/report', getQueueReport);
router.get('/queue/details', getQueueDetails);

export default router;
