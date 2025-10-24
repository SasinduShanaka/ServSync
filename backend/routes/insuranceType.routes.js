// src/routes/insuranceType.routes.js
import { Router } from 'express';
import { createInsuranceType, listInsuranceTypes, getInsuranceTypeById } from '../controllers/insuranceType.Controller.js';
// import auth from '../middlewares/auth.js' // hook later
const router = Router();

router.post('/', /*auth('ADMIN'),*/ createInsuranceType);
router.get('/', /*auth(),*/ listInsuranceTypes);
router.get('/:id', /*auth(),*/ getInsuranceTypeById);

export default router;
