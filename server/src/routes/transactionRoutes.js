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

// POST /api/transactions — create transaction (customer)
router.post(
  "/",
  addRateLimiter(GeneralLimiter, ExcessLimiter),
  requireAuth,
  attachUserId,
  validateData(transactionValidation.createTransactionSchema),
  asyncHandler(transactionController.createTransaction)
);

// Helper: inject session userId into body
function attachUserId(req, _res, next) {
  req.body = { ...req.body, userId: String(req.session.userId) };
  next();
}

// GET /api/transactions/pending — list pending (employee/admin)
router.get(
  "/pending",
  addRateLimiter(GeneralLimiter),
  requireAuth,
  requireRole("employee", "admin"),
  asyncHandler(transactionController.getAllPending)
);

// PATCH /api/transactions/:id/status — update status (employee/admin)
router.patch(
  "/:id/status",
  addRateLimiter(GeneralLimiter, ExcessLimiter),
  requireAuth,
  requireRole("employee", "admin"),
  validateData(transactionValidation.transactionIdSchema, {
    target: "params",
  }),
  validateData(transactionValidation.updateTransactionStatusSchema),
  asyncHandler(transactionController.setTransactionStatus)
);

export default router;
