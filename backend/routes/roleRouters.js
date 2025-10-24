import { Router } from 'express';
import * as ctrl from "../controllers/roleControllers.js";

const router = Router();

router.get("/", ctrl.getAllRoles);
router.post("/", ctrl.addRole);
router.get("/:id", ctrl.getById);
router.put("/:id", ctrl.updateRole);
router.delete("/:id", ctrl.deleteRole);

router.post("/login", ctrl.staffLogin);
router.post("/logout", ctrl.staffLogout);
router.get("/me", ctrl.getMyRole);
router.put("/me", ctrl.updateMyRole);

export default router;
