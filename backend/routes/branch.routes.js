// src/routes/branch.routes.js
import { Router } from 'express';
import { createBranch, addCounter, getBranch, listBranches, deleteCounter } from '../controllers/branch.Controller.js';
const router = Router();

router.post('/', /*auth('ADMIN|MANAGER'),*/ createBranch);
router.post('/:branchId/counters', /*auth('ADMIN|MANAGER'),*/ addCounter);
router.delete('/:branchId/counters/:counterId', /*auth('ADMIN|MANAGER'),*/ deleteCounter);
router.get('/', /*auth(),*/ listBranches);
router.get('/:branchId', /*auth(),*/ getBranch);

export default router;
