import { Router } from 'express';
import * as ctrl from '../controllers/token.controller.js';

const router = Router();

router.post('/', ctrl.createToken);
router.get('/waiting', ctrl.listWaiting);
router.post('/pop-next', ctrl.popNext);
router.post('/recall', ctrl.recall);
router.post('/start', ctrl.start);
router.post('/complete', ctrl.complete);
router.post('/skip', ctrl.skip);
router.post('/transfer', ctrl.transfer);
router.get('/current', ctrl.getCurrent);
router.get('/by-session', ctrl.listBySession);
router.post('/return-to-waiting', ctrl.returnToWaiting);

export default router;
