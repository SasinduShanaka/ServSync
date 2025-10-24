// src/routes/testSms.routes.js
import { Router } from 'express';
import { sendTestSms } from '../controllers/testSms.controller.js';

const router = Router();

// Test SMS endpoint
router.post('/send', sendTestSms);

export default router;