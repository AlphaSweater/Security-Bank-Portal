import express from "express";
import * as userController from "#controllers/userController.js";
import requireAuth from "#middlewares/authMiddleware.js";
import { requireRole } from "#middlewares/roleMiddleware.js";
import { asyncHandler } from "#utils/asyncHandler.js";
import { addRateLimiter } from "#middlewares/rateLimitMiddleware.js";
import { GeneralLimiter } from "#config/rateLimitConfig.js";

const router = express.Router();

// Get my transactions
router.get(
  "/me/transactions",
  addRateLimiter(GeneralLimiter),
  requireAuth,
  requireRole("customer"),
  asyncHandler(userController.getMyTransactions)
);

export default router;
