import express from "express";
import * as employeeController from "#controllers/employeeController.js";
import requireAuth from "#middlewares/authMiddleware.js";
import { requireRole } from "#middlewares/roleMiddleware.js";
import { asyncHandler } from "#utils/asyncHandler.js";
import { addRateLimiter } from "#middlewares/rateLimitMiddleware.js";
import { GeneralLimiter, ExcessLimiter } from "#config/rateLimitConfig.js";
import { validateData } from "#middlewares/validationMiddleware.js";
import * as transactionValidation from "#utils/validation/transactionValidation.js";

const router = express.Router();

/* =============================================================================
 * EMPLOYEE ROUTES - Transaction Review & Management Operations
 * All routes require 'employee' or 'admin' role
 * ========================================================================== */

// GET /api/employees/dashboard - Get employee/admin dashboard
router.get(
  "/dashboard",
  addRateLimiter(GeneralLimiter),
  requireAuth,
  requireRole("employee", "admin"),
  asyncHandler(employeeController.getEmployeeDashboard)
);

// GET /api/employees/review-queue - Get prioritized review queue
router.get(
  "/review-queue",
  addRateLimiter(GeneralLimiter),
  requireAuth,
  requireRole("employee", "admin"),
  asyncHandler(employeeController.getReviewQueue)
);

// GET /api/employees/transactions/:id - Get transaction for review
router.get(
  "/transactions/:id",
  addRateLimiter(GeneralLimiter),
  requireAuth,
  requireRole("employee", "admin"),
  validateData(transactionValidation.transactionIdSchema, {
    target: "params",
  }),
  asyncHandler(employeeController.getTransactionForReview)
);

// PATCH /api/employees/transactions/:id/review - Review transaction (approve/reject)
router.patch(
  "/transactions/:id/review",
  addRateLimiter(GeneralLimiter, ExcessLimiter),
  requireAuth,
  requireRole("employee", "admin"),
  validateData(transactionValidation.transactionIdSchema, {
    target: "params",
  }),
  validateData(transactionValidation.updateTransactionStatusSchema),
  asyncHandler(employeeController.reviewTransaction)
);

// GET /api/employees/performance - Get my performance metrics
router.get(
  "/performance",
  addRateLimiter(GeneralLimiter),
  requireAuth,
  requireRole("employee", "admin"),
  asyncHandler(employeeController.getMyPerformance)
);

// GET /api/employees/reviewed-transactions - Get my reviewed transactions
router.get(
  "/reviewed-transactions",
  addRateLimiter(GeneralLimiter),
  requireAuth,
  requireRole("employee", "admin"),
  asyncHandler(employeeController.getMyReviewedTransactions)
);

// GET /api/employees/analytics - Get system-wide analytics
router.get(
  "/analytics",
  addRateLimiter(GeneralLimiter),
  requireAuth,
  requireRole("employee", "admin"),
  asyncHandler(employeeController.getSystemAnalytics)
);

export default router;
