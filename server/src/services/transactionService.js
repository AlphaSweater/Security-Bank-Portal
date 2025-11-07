// transactionService.js
import * as transactionRepo from "#models/transactionModel.js";
import { getCustomerTransactionStats } from "#services/customerService.js";
import { getLogger } from "#utils/logger.js";

const logger = getLogger(import.meta.url);

/* =============================================================================
 * TRANSACTION SERVICE
 * ========================================================================== */

/* =============================================================================
 * RISK THRESHOLDS
 * ---------------------------------------------------------------------------
 * Each factor (amount, frequency, volume) defines:
 * - A BASE value (acceptable safe range)
 * - Derived thresholds as % increases over that base
 * ========================================================================== */

const BASE_VALUES = {
  AMOUNT: 5000, // acceptable transaction amount
  FREQUENCY: 5, // acceptable number of daily transactions
  VOLUME: 10000, // acceptable daily total volume
};

// Multipliers as % increases over the base
const THRESHOLD_LEVELS = {
  LOW: 1.5, // +50%
  MEDIUM: 2, // +100%
  HIGH: 3, // +200%
};

// Derived thresholds
const THRESHOLDS = {
  // Amount thresholds
  LOW_AMOUNT_THRESHOLD: BASE_VALUES.AMOUNT * THRESHOLD_LEVELS.LOW,
  MEDIUM_AMOUNT_THRESHOLD: BASE_VALUES.AMOUNT * THRESHOLD_LEVELS.MEDIUM,
  HIGH_AMOUNT_THRESHOLD: BASE_VALUES.AMOUNT * THRESHOLD_LEVELS.HIGH,

  // Frequency thresholds
  LOW_FREQUENCY_THRESHOLD: BASE_VALUES.FREQUENCY * THRESHOLD_LEVELS.LOW,
  MEDIUM_FREQUENCY_THRESHOLD: BASE_VALUES.FREQUENCY * THRESHOLD_LEVELS.MEDIUM,
  HIGH_FREQUENCY_THRESHOLD: BASE_VALUES.FREQUENCY * THRESHOLD_LEVELS.HIGH,

  // Volume thresholds
  LOW_VOLUME_THRESHOLD: BASE_VALUES.VOLUME * THRESHOLD_LEVELS.LOW,
  MEDIUM_VOLUME_THRESHOLD: BASE_VALUES.VOLUME * THRESHOLD_LEVELS.MEDIUM,
  HIGH_VOLUME_THRESHOLD: BASE_VALUES.VOLUME * THRESHOLD_LEVELS.HIGH,
};

/* =============================================================================
 * CREATE OPERATIONS
 * ========================================================================== */

/**
 * Creates a transaction with risk assessment.
 * - Applies risk assessment based on thresholds
 * - Adds metadata for compliance
 * - Stores risk level and factors in the database
 *
 * @param {Object} payload - Transaction data
 * @returns {Promise<{transactionId: ObjectId, status: string, riskLevel: string, message: string}>}
 */
export async function createTransaction(payload) {
  logger.info("Creating new transaction...", {
    userId: payload.userId,
    amount: payload.amount,
  });

  try {
    const todayStats = await getCustomerTransactionStats(payload.userId, "day");
    const riskAssessment = assessTransactionRisk(payload, todayStats);

    const doc = {
      ...payload,
      riskLevel: riskAssessment.level,
      riskFactors: riskAssessment.factors,
      metadata: {
        dailyTransactionCount: todayStats.count + 1,
        dailyVolume: todayStats.totalVolume + Number(payload.amount || 0),
      },
    };

    const result = await transactionRepo.insertTransaction(doc);

    logger.info("Transaction created successfully", {
      transactionId: result.id,
      amount: payload.amount,
      riskLevel: riskAssessment.level,
      factors: riskAssessment.factors,
    });

    return {
      transactionId: result.id,
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

/* =============================================================================
 * READ OPERATIONS
 * ========================================================================== */

/**
 * Get a single user transaction by ID (default safe detail projection).
 *
 * @param {string} id - Transaction ID
 * @param {{ projection?: Object }} [options]
 * @returns {Promise<Object|null>} - Transaction or null
 */
export async function getUserTransactionById(id, options = {}) {
  const projection =
    options.projection || transactionRepo.PROJECTIONS.DETAIL_PUBLIC;

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
 * Get a user's transactions with an optional status filter (default safe list projection).
 *
 * @param {string} userId - The user's ID
 * @param {Object} options - Filter & pagination (status, limit, after, startEpoch, endEpoch, projection)
 * @returns {Promise<{ items: Array, nextCursor: string|null }>}
 */
export async function getUserTransactions(userId, options = {}) {
  if (!userId) {
    logger.warn("User ID is required to fetch user transactions");
    return { items: [], nextCursor: null };
  }

  const {
    status,
    projection = transactionRepo.PROJECTIONS.CUSTOMER_LIST,
    ...paginationOptions
  } = options;

  try {
    let result;

    if (
      status &&
      typeof transactionRepo.getTransactionsMadeByUserByStatus === "function"
    ) {
      result = await transactionRepo.getTransactionsMadeByUserByStatus(
        userId,
        status,
        { projection, ...paginationOptions }
      );
      logger.debug?.("Retrieved user transactions by status", {
        userId,
        status,
        count: result?.items?.length ?? 0,
      });
    } else {
      result = await transactionRepo.getTransactionsMadeByUser(userId, {
        projection,
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
 * RISK ASSESSMENT LOGIC
 * ========================================================================== */

/**
 * Converts a numeric value into a tier: none | low | medium | high
 */
function gradeToTier(value, low, medium, high) {
  if (value >= high) return "high";
  if (value >= medium) return "medium";
  if (value >= low) return "low";
  return "none";
}

/** Rank tiers numerically for easy comparison. */
function tierRank(t) {
  return t === "none" ? 0 : t === "low" ? 1 : t === "medium" ? 2 : 3;
}

/**
 * Evaluate the transaction’s risk level.
 * @returns {{ level: "none"|"low"|"medium"|"high", factors: string[], message: string }}
 */
function assessTransactionRisk(txn, daily) {
  const amount = Number(txn.amount || 0);
  const projectedCount = Number(daily.count || 0) + 1;
  const projectedVolume = Number(daily.totalVolume || 0) + amount;

  // Determine individual dimension severities
  const amountTier = gradeToTier(
    amount,
    THRESHOLDS.LOW_AMOUNT_THRESHOLD,
    THRESHOLDS.MEDIUM_AMOUNT_THRESHOLD,
    THRESHOLDS.HIGH_AMOUNT_THRESHOLD
  );

  const freqTier = gradeToTier(
    projectedCount,
    THRESHOLDS.LOW_FREQUENCY_THRESHOLD,
    THRESHOLDS.MEDIUM_FREQUENCY_THRESHOLD,
    THRESHOLDS.HIGH_FREQUENCY_THRESHOLD
  );

  const volumeTier = gradeToTier(
    projectedVolume,
    THRESHOLDS.LOW_VOLUME_THRESHOLD,
    THRESHOLDS.MEDIUM_VOLUME_THRESHOLD,
    THRESHOLDS.HIGH_VOLUME_THRESHOLD
  );

  // Overall risk = highest severity across amount, frequency, volume
  const finalTier = [amountTier, freqTier, volumeTier].sort(
    (a, b) => tierRank(b) - tierRank(a)
  )[0];

  // Build factor list
  const factors = [];
  if (amountTier !== "none") factors.push(`amount_${amountTier}`);
  if (freqTier !== "none") factors.push(`frequency_${freqTier}`);
  if (volumeTier !== "none") factors.push(`volume_${volumeTier}`);

  const messageByLevel = {
    none: "Transaction safe - no risk flags.",
    low: "Transaction safe - low risk.",
    medium: "Transaction flagged - moderate risk. (Review recommended)",
    high: "Transaction flagged - high risk. (Requires review)",
  };

  return {
    level: finalTier,
    factors,
    message: messageByLevel[finalTier],
  };
}
