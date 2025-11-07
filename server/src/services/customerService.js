import * as transactionRepo from "#models/transactionModel.js";
import * as userRepo from "#models/userModel.js";
import { getLogger } from "#utils/logger.js";

const logger = getLogger(import.meta.url);

/* =============================================================================
 * CUSTOMER SERVICE - Customer-facing transaction operations
 * Handles transaction creation, viewing own transactions, and customer limits
 * ========================================================================== */

const CUSTOMER_LIMITS = {
  MAX_TRANSACTIONS_PER_DAY: 10,
  MAX_DAILY_VOLUME: 50000,
  HIGH_VALUE_THRESHOLD: 10000,
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,
};

/* =============================================================================
 * CUSTOMER DASHBOARD & TRANSACTION VIEWING
 * ========================================================================== */

/**
 * Gets comprehensive dashboard data for a customer.
 * Includes recent transactions, statistics, and account limits.
 *
 * @param {string} userId - Customer user ID
 * @param {Object} options - Pagination options
 * @returns {Promise<{transactions: Object, summary: Object, limits: Object}>}
 */
export async function getCustomerDashboard(userId, options = {}) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const limit = Math.min(
      options.limit || CUSTOMER_LIMITS.DEFAULT_PAGE_SIZE,
      CUSTOMER_LIMITS.MAX_PAGE_SIZE
    );

    // Fetch data in parallel
    const [transactions, statusCounts, dailyStats, userInfo] =
      await Promise.all([
        transactionRepo.getTransactionsMadeByUser(userId, {
          ...options,
          limit,
        }),
        transactionRepo.countTransactionsMadeByUserByStatus(userId),
        getCustomerDailyStats(userId),
        userRepo.getUserById(userId),
      ]);

    const total = Object.values(statusCounts).reduce(
      (sum, count) => sum + count,
      0
    );

    logger.debug("Retrieved customer dashboard", {
      userId,
      totalTransactions: total,
      todayCount: dailyStats.count,
    });

    return {
      transactions,
      summary: {
        total,
        byStatus: statusCounts,
        recentActivity: {
          todayCount: dailyStats.count,
          todayVolume: dailyStats.totalVolume,
          averageAmount:
            dailyStats.count > 0
              ? Math.round(dailyStats.totalVolume / dailyStats.count)
              : 0,
        },
      },
      limits: {
        dailyTransactionLimit: CUSTOMER_LIMITS.MAX_TRANSACTIONS_PER_DAY,
        dailyVolumeLimit: CUSTOMER_LIMITS.MAX_DAILY_VOLUME,
        remainingTransactions:
          CUSTOMER_LIMITS.MAX_TRANSACTIONS_PER_DAY - dailyStats.count,
        remainingVolume: Math.max(
          0,
          CUSTOMER_LIMITS.MAX_DAILY_VOLUME - dailyStats.totalVolume
        ),
      },
      user: {
        firstName: userInfo?.firstName,
        lastName: userInfo?.lastName,
        email: userInfo?.email,
      },
    };
  } catch (error) {
    logger.error("Failed to get customer dashboard", {
      error: error.message,
      userId,
    });
    throw error;
  }
}
