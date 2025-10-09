import express from "express";
import * as userController from "#controllers/userController.js";
import requireAuth from "#middlewares/authMiddleware.js";
import { requireRole } from "#middlewares/roleMiddleware.js";
import { asyncHandler } from "#utils/asyncHandler.js";
import { addRateLimiter } from "#middlewares/rateLimitMiddleware.js";
import { GeneralRateLimiter } from "#config/rateLimitConfig.js";

const router = express.Router();

router.get(
  "/me",
  ...addRateLimiter(GeneralRateLimiter),
  requireAuth,
  userController.getMe
);

// Protected dashboard route
router.get(
  "/dashboard",
  ...addRateLimiter(GeneralRateLimiter),
  requireAuth,
  userController.getDashboard
);

// Example: only admin can access
router.get(
  "/admin-data",
  ...addRateLimiter(GeneralRateLimiter),
  requireAuth,
  requireRole("admin"),
  userController.getAdminData
);

export default router;
