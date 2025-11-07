import * as transactionRepo from "#models/transactionModel.js";
import * as customerRepo from "#models/userModel.js";
import { getLogger } from "#utils/logger.js";

const logger = getLogger(import.meta.url);

/* =============================================================================
 * CUSTOMER SERVICE - Customer-facing transaction operations
 * Handles transaction viewing and dashboard display
 * ========================================================================== */

const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,
};

/* =============================================================================
 * CUSTOMER DASHBOARD & TRANSACTION VIEWING
 * ========================================================================== */

/**
 * Gets comprehensive dashboard data for a customer.
 * Includes recent transactions and statistics.
 *
 * @param {string} userId - Customer user ID
 * @param {Object} options - Pagination options
 * @returns {Promise<{transactions: Object, summary: Object, user: Object}>}
 */
export async function getCustomerDashboard(userId, options = {}) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const limit = Math.min(
      options.limit || PAGINATION_DEFAULTS.DEFAULT_PAGE_SIZE,
      PAGINATION_DEFAULTS.MAX_PAGE_SIZE
    );

    // Fetch data in parallel
    const [transactions, statusCounts, userInfo, monthStats] =
      await Promise.all([
        transactionRepo.getTransactionsMadeByUser(userId, {
          ...options,
          limit,
        }),
        transactionRepo.countTransactionsMadeByUserByStatus(userId),
        customerRepo.getUserById(userId, {
          projection: customerRepo.PROJECTIONS.PUBLIC_PROFILE,
        }),
        getCustomerTransactionStats(userId, "month"),
      ]);

    const total = Object.values(statusCounts).reduce(
      (sum, count) => sum + count,
      0
    );

    logger.debug("Retrieved customer dashboard", {
      userId,
      totalTransactions: total,
    });

    return {
      transactions,
      summary: {
        total,
        byStatus: statusCounts,
      },
      monthStats: {
        count: monthStats.count,
        totalVolume: monthStats.totalVolume,
        startEpoch: monthStats.startEpoch,
        endEpoch: monthStats.endEpoch,
      },
      user: {
        firstName: userInfo?.firstName,
        lastName: userInfo?.lastName,
        email: userInfo?.email,
        role: userInfo?.role,
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

/* =============================================================================
 * HELPER FUNCTIONS
 * ========================================================================== */

/**
 * Gets a customer's transaction statistics for a given time period.
 * Period can be: "day", "week", "month", or "year".
 *
 * @param {string} customerId - The customer's ID
 * @param {"day"|"week"|"month"|"year"} [period="day"] - Time period to fetch stats for
 * @returns {Promise<{ count: number, totalVolume: number, startEpoch: number, endEpoch: number }>}
 */
export async function getCustomerTransactionStats(customerId, period = "day") {
  if (!customerId) {
    logger.warn("getCustomerTransactionStats called without customerId");
    return { count: 0, totalVolume: 0, startEpoch: 0, endEpoch: 0 };
  }

  const now = new Date();
  let start = new Date(now);

  switch (period) {
    case "week": {
      // Start of current week (Monday 00:00:00)
      const day = now.getDay(); // Sunday = 0, Monday = 1, ...
      const diffToMonday = (day + 6) % 7;
      start.setDate(now.getDate() - diffToMonday);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case "month": {
      // Start of current month
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    }
    case "year": {
      // Start of current year
      start = new Date(now.getFullYear(), 0, 1);
      break;
    }
    case "day":
    default: {
      // Start of today
      start.setHours(0, 0, 0, 0);
      break;
    }
  }

  const startEpoch = Math.floor(start.getTime() / 1000);
  const endEpoch = Math.floor(now.getTime() / 1000);

  try {
    const transactions = await transactionRepo.getTransactionsMadeByUser(
      customerId,
      {
        startEpoch,
        endEpoch,
        limit: 5000,
      }
    );

    const totalVolume = transactions.items.reduce(
      (sum, tx) => sum + (Number(tx.amount) || 0),
      0
    );

    return {
      count: transactions.items.length,
      totalVolume,
      startEpoch,
      endEpoch,
    };
  } catch (error) {
    logger.error("Failed to get customer transaction stats", {
      error: error.message,
      customerId,
      period,
    });
    throw error;
  }
}
