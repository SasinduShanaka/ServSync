import express from 'express';
import * as ctrl from '../controllers/userControllers.js';  // Importing controller using ES Modules

const router = express.Router();

// Auth (user side)
router.post("/login", ctrl.userLogin);
router.post("/logout", ctrl.userLogout);
router.get("/me", ctrl.getCurrentUser);

// Profile (user side)
router.get("/me/profile", ctrl.getMyProfile);
router.put("/me/profile", ctrl.updateMyProfile);

// CRUD (admin side)
router.get("/", ctrl.getAllUsers);
router.get("/:id", ctrl.getById);
router.post("/", ctrl.addUsers);
router.put("/:id", ctrl.updateUser);
router.delete("/:id", ctrl.deleteUser);

export default router;
