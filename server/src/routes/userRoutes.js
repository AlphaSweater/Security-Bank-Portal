import express from "express";
import * as userController from "#controllers/userController.js";
import requireAuth from "#middlewares/authMiddleware.js";
import { asyncHandler } from "#utils/asyncHandler.js";
import { addRateLimiter } from "#middlewares/rateLimitMiddleware.js";
import { GeneralLimiter } from "#config/rateLimitConfig.js";
import { validateData } from "#middlewares/validationMiddleware.js";
import * as userValidation from "#utils/validation/userValidation.js";

const router = express.Router();

/* =============================================================================
 * USER ROUTES - General User Profile Operations
 * These routes work for all authenticated users regardless of role
 * ========================================================================== */

// GET /api/users/me - Get full profile
router.get(
  "/me",
  addRateLimiter(GeneralLimiter),
  requireAuth,
  asyncHandler(userController.getMyProfile)
);

// GET /api/users/me/info - Get basic info (lightweight)
router.get(
  "/me/info",
  addRateLimiter(GeneralLimiter),
  requireAuth,
  asyncHandler(userController.getMyBasicInfo)
);

// PATCH /api/users/me - Update profile
router.patch(
  "/me",
  addRateLimiter(GeneralLimiter),
  requireAuth,
  validateData(userValidation.updateProfileSchema),
  asyncHandler(userController.updateMyProfile)
);

export default router;
