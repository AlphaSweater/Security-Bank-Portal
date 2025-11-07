import * as transactionRepo from "#models/transactionModel.js";
import { getLogger } from "#utils/logger.js";

const logger = getLogger(import.meta.url);

/* =============================================================================
 * EMPLOYEE SERVICE - Transaction Review & Approval Operations
 * Used by BOTH employees and admins for transaction management
 *
 * Handles:
 * - Transaction review queue (prioritized by riskLevel)
 * - Approve/reject individual transactions
 * - Reviewer performance tracking
 * - System analytics for dashboards
 * ========================================================================== */

const REVIEW_CONFIG = {
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,
  ALERT_PENDING_THRESHOLD: 20, // Alert if pending rate > 20%
};

const ALLOWED_REVIEW_STATUSES = new Set([
  transactionRepo.TRANSACTION_STATUS.APPROVED,
  transactionRepo.TRANSACTION_STATUS.REJECTED,
]);

/* =============================================================================
 * REVIEW QUEUE MANAGEMENT
 * ========================================================================== */

/**
 * Gets prioritized review queue for transaction reviews.
 * Priority: riskLevel (high → medium → low → none), then amount desc as a tie-breaker only.
 *
 * @param {Object} options - Pagination and filter options
 * @param {number} [options.limit] - Page size (default 25, max 100)
 * @param {("all"|"risk_high"|"risk_medium"|"risk_low"|"risk_none")} [options.filterType="all"]
 * @returns {Promise<{items: Array, nextCursor: string|null, queueStats: Object}>}
 */
export async function getReviewQueue(options = {}) {
  try {
    const limit = Math.min(
      options.limit || REVIEW_CONFIG.DEFAULT_PAGE_SIZE,
      REVIEW_CONFIG.MAX_PAGE_SIZE
    );

    // Get all pending transactions (no amount gating)
    const pending = await transactionRepo.getTransactionsMadeByUser(null, {
      status: transactionRepo.TRANSACTION_STATUS.PENDING,
      ...options,
      userId: undefined,
      limit: REVIEW_CONFIG.MAX_PAGE_SIZE,
    });

    let filteredItems = pending.items;

    // Risk-based filtering only (no high-value/standard)
    const riskKey = (options.filterType || "all").toLowerCase();
    const riskMap = {
      risk_high: "high",
      risk_medium: "medium",
      risk_low: "low",
      risk_none: "none",
    };
    if (riskKey in riskMap) {
      const target = riskMap[riskKey];
      filteredItems = filteredItems.filter(
        (t) => (t.riskLevel || "none") === target
      );
    }

    // Prioritize by risk then by amount within same risk (amount is just a tie-breaker)
    const riskOrder = { high: 0, medium: 1, low: 2, none: 3 };
    const prioritized = filteredItems.sort((a, b) => {
      const aRisk = a.riskLevel || "none";
      const bRisk = b.riskLevel || "none";
      if (riskOrder[aRisk] !== riskOrder[bRisk]) {
        return riskOrder[aRisk] - riskOrder[bRisk];
      }
      // Tie-breaker by amount (desc). This does not create any “high-value” rules.
      return (b.amount || 0) - (a.amount || 0);
    });

    // Queue statistics (risk-only)
    const queueStats = {
      total: prioritized.length,
      highRisk: prioritized.filter((t) => t.riskLevel === "high").length,
      mediumRisk: prioritized.filter((t) => t.riskLevel === "medium").length,
      lowRisk: prioritized.filter((t) => t.riskLevel === "low").length,
      noneRisk: prioritized.filter(
        (t) => !t.riskLevel || t.riskLevel === "none"
      ).length,
    };

    logger.debug("Retrieved review queue", {
      ...queueStats,
      filterType: options.filterType || "all",
    });

    return {
      items: prioritized.slice(0, limit),
      nextCursor: prioritized.length > limit ? "has_more" : null,
      queueStats,
    };
  } catch (error) {
    logger.error("Failed to get review queue", { error: error.message });
    throw error;
  }
}

/* =============================================================================
 * TRANSACTION REVIEW
 * ========================================================================== */

/**
 * Reviews a transaction (approve/reject).
 *
 * Authorization rules:
 * - No amount-based restriction. Risk decisions are external.
 * - Rejections must include a reason.
 *
 * @param {Object} params
 * @param {string} params.transactionId
 * @param {string} params.status - approved | rejected
 * @param {string} params.reviewerId
 * @param {string} params.reviewerRole - 'employee' | 'admin' (kept for auditing)
 * @param {string} [params.reason] - Required if status is rejected
 * @returns {Promise<{transaction: Object, reviewMetadata: Object}>}
 */
export async function reviewTransaction({
  transactionId,
  status,
  reviewerId,
  reviewerRole,
  reason,
}) {
  if (!transactionId) throw new Error("Transaction ID is required");
  if (!status) throw new Error("Status is required");
  if (!reviewerId) throw new Error("Reviewer ID is required");
  if (!reviewerRole) throw new Error("Reviewer role is required");

  if (!ALLOWED_REVIEW_STATUSES.has(status)) {
    throw new Error("Invalid review status");
  }

  logger.info("Reviewing transaction", {
    transactionId,
    status,
    reviewerId,
    reviewerRole,
  });

  try {
    const transaction = await transactionRepo.getTransactionById(transactionId);
    if (!transaction) throw new Error("Transaction not found");

    if (transaction.status !== transactionRepo.TRANSACTION_STATUS.PENDING) {
      throw new Error(
        `Transaction already ${transaction.status}. Cannot review again.`
      );
    }

    // Rejections must include a reason
    if (
      status === transactionRepo.TRANSACTION_STATUS.REJECTED &&
      (!reason || reason.trim().length === 0)
    ) {
      throw new Error("Rejection reason is required");
    }

    // Perform the update
    const result = await transactionRepo.updateTransactionStatus(
      transactionId,
      status,
      reviewerId,
      reason
    );
    if (!result) throw new Error("Failed to update transaction status");

    const reviewTime = result.statusUpdatedAtEpoch - result.createdAtEpoch;
    const reviewTimeMinutes = Math.round(reviewTime / 60);

    logger.info("Transaction reviewed successfully", {
      transactionId,
      status,
      reviewerId,
      reviewerRole,
      reviewTimeMinutes,
      amount: transaction.amount,
    });

    return {
      transaction: result,
      reviewMetadata: {
        reviewedBy: reviewerId,
        reviewerRole,
        reviewedAt: result.statusUpdatedAtEpoch,
        reviewTime: reviewTimeMinutes,
        previousStatus: transaction.status,
        newStatus: status,
        // No high-value flags here anymore
      },
    };
  } catch (error) {
    logger.error("Failed to review transaction", {
      error: error.message,
      transactionId,
      status,
      reviewerRole,
    });
    throw error;
  }
}

/* =============================================================================
 * REVIEWER PERFORMANCE & STATISTICS
 * ========================================================================== */

/**
 * Gets performance dashboard for a reviewer (employee or admin).
 *
 * @param {string} reviewerId
 * @param {Object} options
 * @returns {Promise<{reviews: Object, performance: Object}>}
 */
export async function getEmployeePerformance(reviewerId, options = {}) {
  if (!reviewerId) throw new Error("Reviewer ID is required");

  try {
    const limit = Math.min(
      options.limit || REVIEW_CONFIG.DEFAULT_PAGE_SIZE,
      REVIEW_CONFIG.MAX_PAGE_SIZE
    );

    const [reviews, statusCounts] = await Promise.all([
      transactionRepo.getTransactionsReviewedByEmployee(reviewerId, {
        ...options,
        limit,
      }),
      transactionRepo.countTransactionsReviewedByEmployeeByStatus(
        reviewerId,
        options
      ),
    ]);

    const total = Object.values(statusCounts).reduce((sum, c) => sum + c, 0);

    let avgReviewTime = null;
    if (reviews.items.length > 0) {
      const totalTime = reviews.items.reduce(
        (sum, txn) => sum + (txn.statusUpdatedAtEpoch - txn.createdAtEpoch),
        0
      );
      avgReviewTime = Math.round(totalTime / reviews.items.length / 60);
    }

    logger.debug("Retrieved reviewer performance", {
      reviewerId,
      totalReviews: total,
      avgReviewTime,
    });

    return {
      reviews,
      performance: {
        total,
        byStatus: statusCounts,
        avgReviewTime,
        approvalRate:
          total > 0
            ? Math.round(((statusCounts.approved || 0) / total) * 100)
            : null,
        rejectionRate:
          total > 0
            ? Math.round(((statusCounts.rejected || 0) / total) * 100)
            : null,
      },
    };
  } catch (error) {
    logger.error("Failed to get reviewer performance", {
      error: error.message,
      reviewerId,
    });
    throw error;
  }
}

/**
 * Gets transactions reviewed by a reviewer with optional status filter.
 *
 * @param {string} reviewerId
 * @param {Object} options
 * @returns {Promise<{items: Array, nextCursor: string|null}>}
 */
export async function getReviewedTransactions(reviewerId, options = {}) {
  if (!reviewerId) throw new Error("Reviewer ID is required");

  try {
    const { status, ...paginationOptions } = options;

    if (status) {
      return transactionRepo.getTransactionsReviewedByEmployeeByStatus(
        reviewerId,
        status,
        paginationOptions
      );
    }

    return transactionRepo.getTransactionsReviewedByEmployee(
      reviewerId,
      paginationOptions
    );
  } catch (error) {
    logger.error("Failed to get reviewed transactions", {
      error: error.message,
      reviewerId,
    });
    throw error;
  }
}

/**
 * Gets a transaction by ID for review purposes (with review context).
 * No amount/high-value flags; context is risk + status.
 *
 * @param {string} transactionId
 * @returns {Promise<Object|null>}
 */
export async function getTransactionForReview(transactionId) {
  if (!transactionId) throw new Error("Transaction ID is required");

  try {
    const transaction = await transactionRepo.getTransactionById(transactionId);
    if (!transaction) return null;

    return {
      ...transaction,
      reviewContext: {
        isPending:
          transaction.status === transactionRepo.TRANSACTION_STATUS.PENDING,
        riskLevel: transaction.riskLevel || "none",
      },
    };
  } catch (error) {
    logger.error("Failed to get transaction for review", {
      error: error.message,
      transactionId,
    });
    throw error;
  }
}

/* =============================================================================
 * SYSTEM ANALYTICS (Dashboard Overview)
 * ========================================================================== */

/**
 * Gets comprehensive system-wide transaction analytics.
 *
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function getSystemAnalytics(options = {}) {
  try {
    const [statusCounts, allTransactions] = await Promise.all([
      transactionRepo.countTransactionsByStatus(options),
      transactionRepo.getTransactionsMadeByUser(null, {
        ...options,
        userId: undefined,
        limit: 1000, // Sample for analytics
      }),
    ]);

    const total = Object.values(statusCounts).reduce((sum, c) => sum + c, 0);

    const approvalRate =
      total > 0 ? Math.round(((statusCounts.approved || 0) / total) * 100) : 0;
    const rejectionRate =
      total > 0 ? Math.round(((statusCounts.rejected || 0) / total) * 100) : 0;
    const pendingRate =
      total > 0 ? Math.round(((statusCounts.pending || 0) / total) * 100) : 0;

    const totalVolume = allTransactions.items.reduce(
      (sum, t) => sum + (t.amount || 0),
      0
    );
    const avgTransactionValue =
      allTransactions.items.length > 0
        ? Math.round(totalVolume / allTransactions.items.length)
        : 0;

    const riskDistribution = {
      high: allTransactions.items.filter((t) => t.riskLevel === "high").length,
      medium: allTransactions.items.filter((t) => t.riskLevel === "medium")
        .length,
      low: allTransactions.items.filter((t) => t.riskLevel === "low").length,
      none: allTransactions.items.filter(
        (t) => t.riskLevel === "none" || !t.riskLevel
      ).length,
    };

    const health = {
      status:
        pendingRate > REVIEW_CONFIG.ALERT_PENDING_THRESHOLD
          ? "attention_needed"
          : "healthy",
      message:
        pendingRate > REVIEW_CONFIG.ALERT_PENDING_THRESHOLD
          ? `High backlog: ${pendingRate}% of transactions pending review`
          : "System operating normally",
      alerts: [],
    };

    if (pendingRate > REVIEW_CONFIG.ALERT_PENDING_THRESHOLD) {
      health.alerts.push({
        type: "high_pending_rate",
        severity: "warning",
        message: `${statusCounts.pending} transactions awaiting review`,
      });
    }

    if (riskDistribution.high > 10) {
      health.alerts.push({
        type: "high_risk_transactions",
        severity: "info",
        message: `${riskDistribution.high} high-risk transactions detected`,
      });
    }

    logger.debug("Retrieved system analytics", {
      total,
      approvalRate,
      pendingRate,
      health: health.status,
    });

    return {
      counts: statusCounts,
      total,
      metrics: {
        approvalRate,
        rejectionRate,
        pendingRate,
        totalVolume,
        avgTransactionValue,
      },
      riskDistribution,
      health,
    };
  } catch (error) {
    logger.error("Failed to get system analytics", { error: error.message });
    throw error;
  }
}

/**
 * Gets dashboard overview for employees/admins.
 *
 * @param {string} reviewerId
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function getEmployeeDashboard(reviewerId, options = {}) {
  try {
    const [analytics, queueData, performance] = await Promise.all([
      getSystemAnalytics(options),
      getReviewQueue({ limit: 10, ...options }),
      getEmployeePerformance(reviewerId, options),
    ]);

    logger.debug("Retrieved reviewer dashboard", { reviewerId });

    return {
      systemHealth: analytics.health,
      overview: {
        totalTransactions: analytics.total,
        pendingCount: analytics.counts.pending || 0,
        approvalRate: analytics.metrics.approvalRate,
        totalVolume: analytics.metrics.totalVolume,
      },
      queue: {
        stats: queueData.queueStats,
        recentItems: queueData.items.slice(0, 5),
      },
      myPerformance: performance.performance,
      metrics: analytics.metrics,
      riskDistribution: analytics.riskDistribution,
    };
  } catch (error) {
    logger.error("Failed to get reviewer dashboard", {
      error: error.message,
      reviewerId,
    });
    throw error;
  }
}
