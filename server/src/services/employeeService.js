import * as transactionRepo from "#models/transactionModel.js";
import * as userRepo from "#models/userModel.js";
import { getLogger } from "#utils/logger.js";

const logger = getLogger(import.meta.url);

/* =============================================================================
 * EMPLOYEE SERVICE - Transaction Review & Approval Operations
 * Used by BOTH employees and admins for transaction management
 *
 * Handles:
 * - Transaction review queue (prioritized)
 * - Approve/reject transactions
 * - Bulk approvals
 * - Review performance tracking
 * - System analytics
 * ========================================================================== */

const REVIEW_CONFIG = {
  HIGH_VALUE_THRESHOLD: 10000, // Employees need admin role for these
  AUTO_APPROVE_THRESHOLD: 100, // Max for bulk approvals
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,
  ALERT_PENDING_THRESHOLD: 20, // Alert if pending rate > 20%
};

/* =============================================================================
 * REVIEW QUEUE MANAGEMENT
 * ========================================================================== */

/**
 * Gets prioritized review queue for transaction reviews.
 * High-risk and high-value transactions appear first.
 * Used by both employees and admins.
 *
 * @param {Object} options - Pagination and filter options
 * @param {string} options.filterType - Optional: 'all', 'high_value', 'standard' (default: 'all')
 * @returns {Promise<{items: Array, nextCursor: string|null, queueStats: Object}>}
 */
export async function getReviewQueue(options = {}) {
  try {
    const limit = Math.min(
      options.limit || REVIEW_CONFIG.DEFAULT_PAGE_SIZE,
      REVIEW_CONFIG.MAX_PAGE_SIZE
    );

    // Get all pending transactions
    const pending = await transactionRepo.getTransactionsMadeByUser(null, {
      status: transactionRepo.TRANSACTION_STATUS.PENDING,
      ...options,
      userId: undefined,
      limit: REVIEW_CONFIG.MAX_PAGE_SIZE,
    });

    let filteredItems = pending.items;

    // Apply filters based on filterType
    if (options.filterType === "high_value") {
      filteredItems = pending.items.filter(
        (t) => t.amount >= REVIEW_CONFIG.HIGH_VALUE_THRESHOLD
      );
    } else if (options.filterType === "standard") {
      filteredItems = pending.items.filter(
        (t) => t.amount < REVIEW_CONFIG.HIGH_VALUE_THRESHOLD
      );
    }

    // Prioritize by risk level, then by amount
    const prioritized = filteredItems.sort((a, b) => {
      const riskOrder = { high: 0, medium: 1, low: 2 };
      const aRisk = a.metadata?.riskLevel || "low";
      const bRisk = b.metadata?.riskLevel || "low";

      if (riskOrder[aRisk] !== riskOrder[bRisk]) {
        return riskOrder[aRisk] - riskOrder[bRisk];
      }

      // Same risk level - sort by amount (descending)
      return b.amount - a.amount;
    });

    // Calculate queue statistics
    const queueStats = {
      total: prioritized.length,
      highRisk: prioritized.filter((t) => t.metadata?.riskLevel === "high")
        .length,
      mediumRisk: prioritized.filter((t) => t.metadata?.riskLevel === "medium")
        .length,
      lowRisk: prioritized.filter((t) => t.metadata?.riskLevel === "low")
        .length,
      highValue: prioritized.filter(
        (t) => t.amount >= REVIEW_CONFIG.HIGH_VALUE_THRESHOLD
      ).length,
      standardValue: prioritized.filter(
        (t) => t.amount < REVIEW_CONFIG.HIGH_VALUE_THRESHOLD
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
    logger.error("Failed to get review queue", {
      error: error.message,
    });
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
 * - Employees (role='employee'): Cannot approve high-value transactions (≥$10k)
 * - Admins (role='admin'): Can approve any transaction
 *
 * @param {Object} params - Review parameters
 * @param {string} params.transactionId - Transaction ID to review
 * @param {string} params.status - New status (approved/rejected)
 * @param {string} params.reviewerId - User ID performing the review
 * @param {string} params.reviewerRole - User role ('employee' or 'admin')
 * @param {string} params.reason - Optional reason (required for rejections)
 * @returns {Promise<Object>} - Updated transaction with review metadata
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

  logger.info("Reviewing transaction", {
    transactionId,
    status,
    reviewerId,
    reviewerRole,
  });

  try {
    // Get transaction to validate business rules
    const transaction = await transactionRepo.getTransactionById(transactionId);

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.status !== transactionRepo.TRANSACTION_STATUS.PENDING) {
      throw new Error(
        `Transaction already ${transaction.status}. Cannot review again.`
      );
    }

    // Business Rule: Only admins can approve high-value transactions
    const isHighValue =
      transaction.amount >= REVIEW_CONFIG.HIGH_VALUE_THRESHOLD;
    const isEmployee = reviewerRole === "employee";
    const isApproval = status === transactionRepo.TRANSACTION_STATUS.APPROVED;

    if (isHighValue && isEmployee && isApproval) {
      logger.warn("Employee attempted to approve high-value transaction", {
        transactionId,
        amount: transaction.amount,
        reviewerId,
      });
      throw new Error(
        `High-value transactions (≥$${REVIEW_CONFIG.HIGH_VALUE_THRESHOLD}) require admin approval`
      );
    }

    // Business Rule: Rejections require a reason
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

    if (!result) {
      throw new Error("Failed to update transaction status");
    }

    // Calculate review time
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
        wasHighValue: isHighValue,
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

/**
 * Bulk approve multiple low-value, low-risk transactions.
 * Only allows bulk approval of safe transactions (< $100, low risk).
 *
 * @param {Array<string>} transactionIds - Array of transaction IDs
 * @param {string} reviewerId - User ID performing bulk approval
 * @returns {Promise<{approved: Array, failed: Array, summary: Object}>}
 */
export async function bulkApproveTransactions(transactionIds, reviewerId) {
  logger.info("Bulk approving transactions", {
    count: transactionIds.length,
    reviewerId,
  });

  const approved = [];
  const failed = [];

  for (const id of transactionIds) {
    try {
      const transaction = await transactionRepo.getTransactionById(id);

      if (!transaction) {
        failed.push({ id, reason: "Transaction not found" });
        continue;
      }

      // Only low-value, low-risk transactions can be bulk approved
      const isLowValue =
        transaction.amount < REVIEW_CONFIG.AUTO_APPROVE_THRESHOLD;
      const isLowRisk = transaction.metadata?.riskLevel === "low";

      if (!isLowValue || !isLowRisk) {
        failed.push({
          id,
          reason: "Requires individual review (high value or risk)",
          amount: transaction.amount,
          riskLevel: transaction.metadata?.riskLevel,
        });
        continue;
      }

      const result = await transactionRepo.updateTransactionStatus(
        id,
        transactionRepo.TRANSACTION_STATUS.APPROVED,
        reviewerId,
        "Bulk approval - low risk transaction"
      );

      if (result) {
        approved.push(id);
      } else {
        failed.push({ id, reason: "Update failed or already processed" });
      }
    } catch (error) {
      failed.push({ id, reason: error.message });
    }
  }

  logger.info("Bulk approval completed", {
    approved: approved.length,
    failed: failed.length,
    reviewerId,
  });

  return {
    approved,
    failed,
    summary: {
      total: transactionIds.length,
      successful: approved.length,
      failed: failed.length,
    },
  };
}

/* =============================================================================
 * REVIEWER PERFORMANCE & STATISTICS
 * ========================================================================== */

/**
 * Gets performance dashboard for a reviewer (employee or admin).
 * Includes review history and performance metrics.
 *
 * @param {string} reviewerId - Reviewer user ID
 * @param {Object} options - Pagination and date range options
 * @returns {Promise<{reviews: Object, performance: Object}>}
 */
export async function getReviewerPerformance(reviewerId, options = {}) {
  if (!reviewerId) {
    throw new Error("Reviewer ID is required");
  }

  try {
    const limit = Math.min(
      options.limit || REVIEW_CONFIG.DEFAULT_PAGE_SIZE,
      REVIEW_CONFIG.MAX_PAGE_SIZE
    );

    // Fetch reviews and statistics
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

    const total = Object.values(statusCounts).reduce(
      (sum, count) => sum + count,
      0
    );

    // Calculate average review time
    let avgReviewTime = null;
    if (reviews.items.length > 0) {
      const totalTime = reviews.items.reduce((sum, txn) => {
        return sum + (txn.statusUpdatedAtEpoch - txn.createdAtEpoch);
      }, 0);
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
 * @param {string} reviewerId - Reviewer user ID
 * @param {Object} options - Filter and pagination options
 * @returns {Promise<{items: Array, nextCursor: string|null}>}
 */
export async function getReviewedTransactions(reviewerId, options = {}) {
  if (!reviewerId) {
    throw new Error("Reviewer ID is required");
  }

  try {
    const { status, ...paginationOptions } = options;

    if (status) {
      return await transactionRepo.getTransactionsReviewedByEmployeeByStatus(
        reviewerId,
        status,
        paginationOptions
      );
    }

    return await transactionRepo.getTransactionsReviewedByEmployee(
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
 * Gets a transaction by ID for review purposes.
 * Includes review context to help determine authorization.
 *
 * @param {string} transactionId - Transaction ID
 * @returns {Promise<Object|null>} - Transaction with review context or null
 */
export async function getTransactionForReview(transactionId) {
  if (!transactionId) {
    throw new Error("Transaction ID is required");
  }

  try {
    const transaction = await transactionRepo.getTransactionById(transactionId);

    if (!transaction) {
      return null;
    }

    // Enrich with additional context for review
    const enriched = {
      ...transaction,
      reviewContext: {
        requiresAdminApproval:
          transaction.amount >= REVIEW_CONFIG.HIGH_VALUE_THRESHOLD,
        canBulkApprove:
          transaction.amount < REVIEW_CONFIG.AUTO_APPROVE_THRESHOLD &&
          transaction.metadata?.riskLevel === "low",
        isPending:
          transaction.status === transactionRepo.TRANSACTION_STATUS.PENDING,
        isHighValue: transaction.amount >= REVIEW_CONFIG.HIGH_VALUE_THRESHOLD,
      },
    };

    return enriched;
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
 * Used for employee/admin dashboards to monitor system health.
 *
 * @param {Object} options - Filter options (date range, etc.)
 * @returns {Promise<Object>} - Detailed analytics with health status
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

    const total = Object.values(statusCounts).reduce(
      (sum, count) => sum + count,
      0
    );

    // Calculate rates
    const approvalRate =
      total > 0 ? Math.round(((statusCounts.approved || 0) / total) * 100) : 0;
    const rejectionRate =
      total > 0 ? Math.round(((statusCounts.rejected || 0) / total) * 100) : 0;
    const pendingRate =
      total > 0 ? Math.round(((statusCounts.pending || 0) / total) * 100) : 0;

    // Calculate volume metrics
    const totalVolume = allTransactions.items.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    const avgTransactionValue =
      allTransactions.items.length > 0
        ? Math.round(totalVolume / allTransactions.items.length)
        : 0;

    // Risk distribution
    const riskDistribution = {
      high:
        allTransactions.items.filter((t) => t.metadata?.riskLevel === "high")
          .length || 0,
      medium:
        allTransactions.items.filter((t) => t.metadata?.riskLevel === "medium")
          .length || 0,
      low:
        allTransactions.items.filter((t) => t.metadata?.riskLevel === "low")
          .length || 0,
    };

    // System health
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
    logger.error("Failed to get system analytics", {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Gets dashboard overview for employees/admins.
 * Combines queue stats, system analytics, and personal performance.
 *
 * @param {string} reviewerId - Reviewer user ID
 * @param {Object} options - Filter options
 * @returns {Promise<Object>} - Dashboard data
 */
export async function getReviewerDashboard(reviewerId, options = {}) {
  try {
    const [analytics, queueData, performance] = await Promise.all([
      getSystemAnalytics(options),
      getReviewQueue({ limit: 10, ...options }),
      getReviewerPerformance(reviewerId, options),
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
        recentItems: queueData.items.slice(0, 5), // Top 5 for dashboard
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
