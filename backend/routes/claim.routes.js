import { Router } from 'express';
import * as ctrl from '../controllers/claim.controller.js';

const router = Router();

router.get('/', ctrl.list);
router.post('/get-or-create', ctrl.getOrCreate);
router.put('/:tokenId', ctrl.update);
router.post('/:tokenId/approve', ctrl.approve);
router.post('/:tokenId/pay', ctrl.pay);

export default router;
