import express from "express";
import * as customerController from "#controllers/customerController.js";
import requireAuth from "#middlewares/authMiddleware.js";
import { requireRole } from "#middlewares/roleMiddleware.js";
import { asyncHandler } from "#utils/asyncHandler.js";
import { addRateLimiter } from "#middlewares/rateLimitMiddleware.js";
import { GeneralLimiter, ExcessLimiter } from "#config/rateLimitConfig.js";
import { validateData } from "#middlewares/validationMiddleware.js";
import * as transactionValidation from "#utils/validation/transactionValidation.js";

const router = express.Router();

/* =============================================================================
 * CUSTOMER ROUTES - Customer-Specific Operations
 * All routes require 'customer' role
 * ========================================================================== */

// GET /api/customers/dashboard - Get customer dashboard
router.get(
  "/dashboard",
  addRateLimiter(GeneralLimiter),
  requireAuth,
  requireRole("customer"),
  asyncHandler(customerController.getCustomerDashboard)
);

// GET /api/customers/transactions - Get my transactions (with filtering)
router.get(
  "/transactions",
  addRateLimiter(GeneralLimiter),
  requireAuth,
  requireRole("customer"),
  asyncHandler(customerController.getMyTransactions)
);

// GET /api/customers/transactions/:id - Get single transaction details
router.get(
  "/transactions/:id",
  addRateLimiter(GeneralLimiter),
  requireAuth,
  requireRole("customer"),
  validateData(transactionValidation.transactionIdSchema, {
    target: "params",
  }),
  asyncHandler(customerController.getTransactionById)
);

// POST /api/customers/transactions - Create new transaction
router.post(
  "/transactions",
  addRateLimiter(GeneralLimiter, ExcessLimiter),
  requireAuth,
  requireRole("customer"),
  validateData(transactionValidation.createTransactionSchema),
  asyncHandler(customerController.createTransaction)
);

// GET /api/customers/stats - Get transaction statistics
router.get(
  "/stats",
  addRateLimiter(GeneralLimiter),
  requireAuth,
  requireRole("customer"),
  asyncHandler(customerController.getMyTransactionStats)
);

export default router;
