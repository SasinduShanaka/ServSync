import express from "express";
import { requestPasswordReset, resetPassword } from "../controllers/resetPasswordController.js";

const router = express.Router();

// POST /reset-password/request
router.post("/request", requestPasswordReset);

// POST /reset-password/confirm
router.post("/confirm", resetPassword);

export default router;
