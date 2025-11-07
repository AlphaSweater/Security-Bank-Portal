import * as transactionRepo from "#models/transactionModel.js";
import { getLogger } from "#utils/logger.js";

const logger = getLogger(import.meta.url);

/* =============================================================================
 * TRANSACTION SERVICE - Core Transaction Operations
 *
 * This service focuses on:
 * - Transaction creation with risk assessment
 * - Transaction retrieval (single and list operations)
 * - Business rule enforcement (limits, risk scoring)
 * ========================================================================== */

/* =============================================================================
 * BUSINESS LOGIC CONSTANTS
 * ========================================================================== */

const BUSINESS_RULES = {
  // Rate limiting thresholds
  MAX_TRANSACTIONS_PER_DAY: 10,
  MAX_DAILY_VOLUME: 50000,

  // Risk assessment thresholds
  HIGH_VALUE_THRESHOLD: 10000, // Used for risk scoring
  HIGH_FREQUENCY_THRESHOLD: 5, // Transactions in a day before flagging
  HIGH_VOLUME_PERCENTAGE: 0.7, // 70% of daily limit triggers medium risk

  // Pagination defaults
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,
};

/* =============================================================================
 * CREATE OPERATIONS
 * ========================================================================== */

/**
 * Creates a transaction with business rule enforcement.
 * - Applies risk assessment
 * - Enforces volume limits
 * - Adds metadata for compliance
 *
 * @param {Object} payload - Transaction data
 * @param {Object} context - Additional context (userRole, ipAddress, etc.)
 * @returns {Promise<{transactionId: ObjectId, status: string, riskLevel: string}>}
 */
export async function createTransaction(payload, context = {}) {
  logger.info("Creating new transaction", {
    userId: payload.userId,
    amount: payload.amount,
  });

  try {
    // Business Rule: Check daily limits for this user
    const todayStats = await getUserDailyTransactionStats(payload.userId);

    // Enforce daily transaction count limit
    if (todayStats.count >= BUSINESS_RULES.MAX_TRANSACTIONS_PER_DAY) {
      logger.warn("Daily transaction limit exceeded", {
        userId: payload.userId,
        count: todayStats.count,
        limit: BUSINESS_RULES.MAX_TRANSACTIONS_PER_DAY,
      });
      throw new Error(
        `Daily transaction limit exceeded. Maximum ${BUSINESS_RULES.MAX_TRANSACTIONS_PER_DAY} transactions per day.`
      );
    }

    // Enforce daily volume limit
    if (
      todayStats.totalVolume + payload.amount >
      BUSINESS_RULES.MAX_DAILY_VOLUME
    ) {
      logger.warn("Daily volume limit exceeded", {
        userId: payload.userId,
        currentVolume: todayStats.totalVolume,
        attemptedAmount: payload.amount,
        limit: BUSINESS_RULES.MAX_DAILY_VOLUME,
      });
      throw new Error(
        `Daily transaction volume limit exceeded. Maximum ${BUSINESS_RULES.MAX_DAILY_VOLUME} per day.`
      );
    }

    // Business Rule: Assess risk level
    const riskAssessment = assessTransactionRisk(payload, todayStats, context);

    // Add enriched data
    const enrichedPayload = {
      ...payload,
      metadata: {
        riskLevel: riskAssessment.level,
        riskFactors: riskAssessment.factors,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        dailyTransactionCount: todayStats.count + 1,
        dailyVolume: todayStats.totalVolume + payload.amount,
      },
    };

    const result = await transactionRepo.insertTransaction(enrichedPayload);

    logger.info("Transaction created successfully", {
      transactionId: result.insertedId.toString(),
      riskLevel: riskAssessment.level,
      amount: payload.amount,
    });

    return {
      transactionId: result.insertedId,
      status: transactionRepo.TRANSACTION_STATUS.PENDING,
      riskLevel: riskAssessment.level,
      message: riskAssessment.message,
    };
  } catch (error) {
    logger.error("Failed to create transaction", {
      error: error.message,
      userId: payload.userId,
    });
    throw error;
  }
}

/**
 * Assesses risk level for a transaction based on business rules.
 * @private
 */
function assessTransactionRisk(transaction, dailyStats, context) {
  const factors = [];
  let level = "low";

  // High-value transaction
  if (transaction.amount >= BUSINESS_RULES.HIGH_VALUE_THRESHOLD) {
    factors.push("high_value");
    level = "high";
  }

  // Unusual frequency
  if (dailyStats.count >= BUSINESS_RULES.HIGH_FREQUENCY_THRESHOLD) {
    factors.push("high_frequency");
    level = level === "high" ? "high" : "medium";
  }

  // High daily volume
  const projectedVolume = dailyStats.totalVolume + transaction.amount;
  if (
    projectedVolume >
    BUSINESS_RULES.MAX_DAILY_VOLUME * BUSINESS_RULES.HIGH_VOLUME_PERCENTAGE
  ) {
    factors.push("high_daily_volume");
    level = level === "high" ? "high" : "medium";
  }

  // International transfer
  if (transaction.destinationCountryCode !== "US") {
    factors.push("international");
    if (level === "low") level = "medium";
  }

  // New device/IP (if available)
  if (context.isNewDevice) {
    factors.push("new_device");
    if (level === "low") level = "medium";
  }

  const messages = {
    low: "Transaction approved - standard processing",
    medium: "Transaction flagged for review - moderate risk",
    high: "Transaction requires manual approval - high risk detected",
  };

  return {
    level,
    factors,
    message: messages[level],
  };
}

/* =============================================================================
 * READ OPERATIONS
 * ========================================================================== */

/* =============================================================================
 * READ OPERATIONS
 * ========================================================================== */

/**
 * Get a single user transaction by ID.
 *
 * @param {string} id - Transaction ID
 * @param {Object} options
 * @param {Object} options.projection - Mongo projection
 * @returns {Promise<Object|null>} - Transaction or null
 */
export async function getUserTransactionById(id, options = {}) {
  const { projection } = options;

  if (!id) {
    logger.warn("Transaction ID is required to fetch user transaction");
    return null;
  }

  try {
    return await transactionRepo.getTransactionById(id, { projection });
  } catch (error) {
    logger.error("Failed to get user transaction by ID", {
      error: error.message,
      transactionId: id,
    });
    throw error;
  }
}

/**
 * Get a user's transactions with an optional status filter.
 *
 * @param {string} userId - The user's ID
 * @param {Object} options - Filter & pagination (status, limit, after, startEpoch, endEpoch, projection)
 * @param {string} options.status - "pending" | "approved" | "rejected"
 * @returns {Promise<{ items: Array, nextCursor: string|null }>}
 */
export async function getUserTransactions(userId, options = {}) {
  if (!userId) {
    logger.warn("User ID is required to fetch user transactions");
    return { items: [], nextCursor: null };
  }

  const { status, ...paginationOptions } = options;

  try {
    let result;

    if (
      status &&
      typeof transactionRepo.getTransactionsMadeByUserByStatus === "function"
    ) {
      result = await transactionRepo.getTransactionsMadeByUserByStatus(
        userId,
        status,
        paginationOptions
      );
      logger.debug?.("Retrieved user transactions by status", {
        userId,
        status,
        count: result?.items?.length ?? 0,
      });
    } else {
      result = await transactionRepo.getTransactionsMadeByUser(userId, {
        ...(status ? { status } : {}),
        ...paginationOptions,
      });
      logger.debug?.("Retrieved user transactions", {
        userId,
        filteredByStatus: Boolean(status),
        count: result?.items?.length ?? 0,
      });
    }

    return result;
  } catch (error) {
    logger.error("Failed to get user transactions", {
      error: error.message,
      userId,
      status,
    });
    throw error;
  }
}

/* =============================================================================
 * HELPER FUNCTIONS
 * ========================================================================== */

/**
 * Gets user's daily transaction statistics.
 * Used for rate limiting and fraud detection.
 * @private
 */
async function getUserDailyTransactionStats(userId) {
  const now = Math.floor(Date.now() / 1000);
  const startOfDay = now - (now % 86400);
  const endOfDay = startOfDay + 86400;

  const transactions = await transactionRepo.getTransactionsMadeByUser(userId, {
    startEpoch: startOfDay,
    endEpoch: endOfDay,
    limit: 1000,
  });

  const totalVolume = transactions.items.reduce(
    (sum, transaction) => sum + transaction.amount,
    0
  );

  return {
    count: transactions.items.length,
    totalVolume,
    startEpoch: startOfDay,
    endEpoch: endOfDay,
  };
}
