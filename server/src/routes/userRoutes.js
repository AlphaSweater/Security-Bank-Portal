import express from "express";
import requireAuth from "#middlewares/auth.js";
import { requireRole } from "#middlewares/roles.js";
import {
  getMe,
  getDashboard,
  getAdminData,
} from "#controllers/userController.js";

const router = express.Router();

router.get("/me", requireAuth, getMe);

// Protected dashboard route
router.get("/dashboard", requireAuth, getDashboard);

// Example: only admin can access
router.get("/admin-data", requireAuth, requireRole("admin"), getAdminData);

export default router;
