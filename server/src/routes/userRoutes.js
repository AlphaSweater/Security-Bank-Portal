import express from "express";
import * as userController from "#controllers/userController.js";
import requireAuth from "#middlewares/authMiddleware.js";
import { requireRole } from "#middlewares/roleMiddleware.js";
import { asyncHandler } from "#utils/asyncHandler.js";

const router = express.Router();

router.get("/me", requireAuth, userController.getMe);

// Protected dashboard route
router.get("/dashboard", requireAuth, userController.getDashboard);

// Example: only admin can access
router.get(
  "/admin-data",
  requireAuth,
  requireRole("admin"),
  userController.getAdminData
);

export default router;
