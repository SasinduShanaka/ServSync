import { Router } from 'express';
import { listBanks, bulkUpsertBanks, getBank } from '../controllers/bank.controller.js';
import { listBranches, bulkUpsertBranches } from '../controllers/bankBranch.controller.js';

const router = Router();

// Banks
router.get('/', listBanks);
router.post('/bulk', bulkUpsertBanks);
router.get('/:bankId', getBank);

// Branches for a bank
router.get('/:bankId/branches', listBranches);
router.post('/:bankId/branches/bulk', bulkUpsertBranches);

export default router;
