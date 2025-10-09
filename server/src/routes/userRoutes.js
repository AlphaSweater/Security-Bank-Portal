import express from "express";
import * as userController from "#controllers/userController.js";
import requireAuth from "#middlewares/authMiddleware.js";
import { requireRole } from "#middlewares/roleMiddleware.js";
import { asyncHandler } from "#utils/asyncHandler.js";
import { addRateLimiter } from "#middlewares/rateLimitMiddleware.js";
import { GeneralLimiter } from "#config/rateLimitConfig.js";

const router = express.Router();

// Protected dashboard route
router.get(
  "/dashboard",
  addRateLimiter(GeneralLimiter),
  requireAuth,
  asyncHandler(userController.getDashboard)
);

export default router;
