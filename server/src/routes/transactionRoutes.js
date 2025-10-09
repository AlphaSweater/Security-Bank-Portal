import express from "express";
import requireAuth from "#middlewares/authMiddleware.js";
import { requireRole } from "#middlewares/roleMiddleware.js";
import { validateData } from "#middlewares/validationMiddleware.js";
import { asyncHandler } from "#utils/asyncHandler.js";
import { addRateLimiter } from "#middlewares/rateLimitMiddleware.js";
import { GeneralLimiter, ExcessLimiter } from "#config/rateLimitConfig.js";

import * as transactionController from "#controllers/transactionController.js";
import * as transactionValidation from "#utils/validation/transactionValidation.js";

const router = express.Router();

// Helper: inject session userId into body for create route
function attachUserId(req, _res, next) {
  // Ensure userId is taken from authenticated session, not client input
  req.body = { ...req.body, userId: String(req.session.userId) };
  next();
}

// Create a new transaction (customer)
router.post(
  "/",
  addRateLimiter(GeneralLimiter, ExcessLimiter),
  requireAuth,
  attachUserId,
  validateData(transactionValidation.createTransactionSchema),
  asyncHandler(transactionController.createTransaction)
);

// Get my transactions (customer)
router.get(
  "/my",
  addRateLimiter(GeneralLimiter),
  requireAuth,
  asyncHandler(transactionController.getMyTransactions)
);

// Get all pending transactions (employee/admin)
router.get(
  "/pending",
  addRateLimiter(GeneralLimiter),
  requireAuth,
  requireRole("employee", "admin"),
  asyncHandler(transactionController.getAllPending)
);

// Update transaction status (employee/admin)
router.patch(
  "/status",
  addRateLimiter(GeneralLimiter, ExcessLimiter),
  requireAuth,
  requireRole("employee", "admin"),
  validateData(transactionValidation.updateTransactionStatusSchema),
  asyncHandler(transactionController.setTransactionStatus)
);

export default router;
