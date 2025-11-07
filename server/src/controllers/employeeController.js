import { getLogger } from "#utils/logger.js";
import * as employeeService from "#services/employeeService.js";

const logger = getLogger(import.meta.url);

/* =============================================================================
 * EMPLOYEE CONTROLLER - Transaction Review & Management Operations
 * Handles employee/admin transaction review, approval, and performance tracking
 * Used by BOTH employees and admins for transaction management
 * ========================================================================== */

// GET /api/employees/dashboard - Get employee/admin dashboard
export async function getEmployeeDashboard(req, res) {
  res.set({ "Cache-Control": "no-store" });
  const reviewerId = req.session?.userId;

  const options = {
    startEpoch: req.query.startEpoch
      ? parseInt(req.query.startEpoch)
      : undefined,
    endEpoch: req.query.endEpoch ? parseInt(req.query.endEpoch) : undefined,
  };

  try {
    const dashboard = await employeeService.getEmployeeDashboard(
      reviewerId,
      options
    );

    return res.json(dashboard);
  } catch (err) {
    logger.error("Failed to fetch employee dashboard", {
      error: err.message,
      reviewerId,
    });
    return res.status(500).json({ message: "Failed to fetch dashboard" });
  }
}

// GET /api/employees/review-queue - Get prioritized review queue
export async function getReviewQueue(req, res) {
  res.set({ "Cache-Control": "no-store" });

  const options = {
    limit: parseInt(req.query.limit) || 25,
    filterType: req.query.filterType || "all", // all, risk_high, risk_medium, risk_low, risk_none
    after: req.query.after,
  };

  try {
    const queue = await employeeService.getReviewQueue(options);

    return res.json(queue);
  } catch (err) {
    logger.error("Failed to fetch review queue", { error: err.message });
    return res.status(500).json({ message: "Failed to fetch review queue" });
  }
}

// GET /api/employees/transactions/:id - Get transaction for review with context
export async function getTransactionForReview(req, res) {
  res.set({ "Cache-Control": "no-store" });
  const { id } = req.params;

  try {
    const transaction = await employeeService.getTransactionForReview(id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    return res.json({ transaction });
  } catch (err) {
    logger.error("Failed to fetch transaction for review", {
      error: err.message,
      transactionId: id,
    });
    return res
      .status(500)
      .json({ message: "Failed to fetch transaction details" });
  }
}

// PATCH /api/employees/transactions/:id/review - Review a transaction (approve/reject)
export async function reviewTransaction(req, res) {
  res.set({ "Cache-Control": "no-store" });
  const { id } = req.params;
  const { status, reason } = req.body; // Validated by middleware
  const reviewerId = req.session?.userId;
  const reviewerRole = req.session?.role;

  try {
    const result = await employeeService.reviewTransaction({
      transactionId: id,
      status,
      reviewerId,
      reviewerRole,
      reason,
    });

    logger.info("Transaction reviewed", {
      transactionId: id,
      status,
      reviewerId,
      reviewerRole,
    });

    return res.json({
      message: `Transaction ${status}`,
      transaction: result.transaction,
      metadata: result.reviewMetadata,
    });
  } catch (err) {
    logger.error("Failed to review transaction", {
      error: err.message,
      transactionId: id,
    });

    // Handle specific error cases
    if (err.message.includes("not found")) {
      return res.status(404).json({ message: err.message });
    }
    if (err.message.includes("already")) {
      return res.status(409).json({ message: err.message });
    }
    if (err.message.includes("reason is required")) {
      return res.status(400).json({ message: err.message });
    }

    return res.status(500).json({ message: "Failed to review transaction" });
  }
}

// GET /api/employees/performance - Get reviewer performance metrics
export async function getMyPerformance(req, res) {
  res.set({ "Cache-Control": "no-store" });
  const reviewerId = req.session?.userId;

  const options = {
    limit: parseInt(req.query.limit) || 25,
    after: req.query.after,
    startEpoch: req.query.startEpoch
      ? parseInt(req.query.startEpoch)
      : undefined,
    endEpoch: req.query.endEpoch ? parseInt(req.query.endEpoch) : undefined,
  };

  try {
    const performance = await employeeService.getEmployeePerformance(
      reviewerId,
      options
    );

    return res.json(performance);
  } catch (err) {
    logger.error("Failed to fetch reviewer performance", {
      error: err.message,
      reviewerId,
    });
    return res
      .status(500)
      .json({ message: "Failed to fetch performance data" });
  }
}

// GET /api/employees/reviewed-transactions - Get transactions reviewed by current user
export async function getMyReviewedTransactions(req, res) {
  res.set({ "Cache-Control": "no-store" });
  const reviewerId = req.session?.userId;

  const options = {
    status: req.query.status, // Optional: filter by status
    limit: parseInt(req.query.limit) || 25,
    after: req.query.after,
    startEpoch: req.query.startEpoch
      ? parseInt(req.query.startEpoch)
      : undefined,
    endEpoch: req.query.endEpoch ? parseInt(req.query.endEpoch) : undefined,
  };

  try {
    const transactions = await employeeService.getReviewedTransactions(
      reviewerId,
      options
    );

    return res.json(transactions);
  } catch (err) {
    logger.error("Failed to fetch reviewed transactions", {
      error: err.message,
      reviewerId,
    });
    return res
      .status(500)
      .json({ message: "Failed to fetch reviewed transactions" });
  }
}

// GET /api/employees/analytics - Get system-wide analytics (for dashboards)
export async function getSystemAnalytics(req, res) {
  res.set({ "Cache-Control": "no-store" });

  const options = {
    startEpoch: req.query.startEpoch
      ? parseInt(req.query.startEpoch)
      : undefined,
    endEpoch: req.query.endEpoch ? parseInt(req.query.endEpoch) : undefined,
  };

  try {
    const analytics = await employeeService.getSystemAnalytics(options);

    return res.json(analytics);
  } catch (err) {
    logger.error("Failed to fetch system analytics", { error: err.message });
    return res.status(500).json({ message: "Failed to fetch analytics" });
  }
}
