// transactionsModel.js
import { getDB } from "#config/mongoDBConfig.js";
import { ObjectId } from "mongodb";
import { epochSecondsNow } from "#utils/timeUtil.js";
import { getLogger } from "#utils/logger.js";

const logger = getLogger(import.meta.url);

/* =============================================================================
 * TRANSACTION STATUS CONSTANTS
 * ========================================================================== */

export const TRANSACTION_STATUS = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
});

const ALLOWED_STATUS = new Set(Object.values(TRANSACTION_STATUS));
const DEFAULT_PAGE_LIMIT = 50;
const MAX_PAGE_LIMIT = 200;

/* =============================================================================
 * DATABASE COLLECTION
 * ========================================================================== */

const getTransactionsCollection = () => getDB().collection("transactions");

/* =============================================================================
 * PROJECTIONS (Optional presets; passing none returns full docs)
 * ---------------------------------------------------------------------------
 * Use these from services, e.g.:
 *   getTransactionsMadeByUser(userId, { projection: PROJECTIONS.CUSTOMER_LIST })
 * ========================================================================== */

export const PROJECTIONS = Object.freeze({
  // Compact fields for a customer's dashboard/list
  CUSTOMER_LIST: {
    _id: 1,
    amount: 1,
    currencyCode: 1,
    status: 1,
    createdAtEpoch: 1,
    statusUpdatedAtEpoch: 1,
  },

  // Reviewer queue (hide PII-heavy beneficiary account fields by default)
  REVIEW_QUEUE: {
    _id: 1,
    userId: 1,
    amount: 1,
    currencyCode: 1,
    status: 1,
    createdAtEpoch: 1,
    riskLevel: 1,
    riskFactors: 1,
  },

  // Public-ish transaction detail (safe for customer-facing detail view)
  DETAIL_PUBLIC: {
    _id: 1,
    userId: 1,
    amount: 1,
    currencyCode: 1,
    beneficiaryType: 1,
    beneficiaryFullName: 1,
    beneficiaryNote: 1,
    destinationCountryCode: 1,
    destinationBankName: 1,
    status: 1,
    createdAtEpoch: 1,
    statusUpdatedAtEpoch: 1,
    reviewReason: 1,
  },

  // Internal detail (includes sensitive routing/account fields)
  DETAIL_INTERNAL: {
    _id: 1,
    userId: 1,
    amount: 1,
    currencyCode: 1,
    beneficiaryType: 1,
    beneficiaryFullName: 1,
    beneficiaryNote: 1,
    destinationCountryCode: 1,
    destinationBankName: 1,
    destinationBankSwift: 1,
    destinationAccountNumber: 1, // PII—use only where appropriate
    status: 1,
    createdAtEpoch: 1,
    statusUpdatedAtEpoch: 1,
    reviewedBy: 1,
    reviewReason: 1,
    riskLevel: 1,
    riskFactors: 1,
    statusHistory: 1,
    metadata: 1,
  },

  // Risk-only slice
  RISK_ONLY: {
    _id: 1,
    riskLevel: 1,
    riskFactors: 1,
    status: 1,
    createdAtEpoch: 1,
  },
});

/* =============================================================================
 * HELPER FUNCTIONS (Internal Use Only)
 * ========================================================================== */

// Converts a string ID to MongoDB ObjectId, throws error if invalid
function toObjectId(id, fieldName = "id") {
  const value = String(id ?? "");
  if (!/^[a-fA-F0-9]{24}$/.test(value)) {
    throw new Error(`Invalid ObjectId for ${fieldName}: "${id}"`);
  }
  return new ObjectId(value);
}

// Serializes a single document: _id → id
function serializeTransaction(doc) {
  if (!doc) return null;
  const { _id, userId, reviewedBy, ...rest } = doc;
  return {
    id: _id.toString(),
    userId: userId?.toString ? userId.toString() : userId,
    reviewedBy: reviewedBy?.toString ? reviewedBy.toString() : reviewedBy,
    ...rest,
  };
}

// Serializes an array of documents: _id → id for each
function serializeTransactions(docs) {
  return docs.map(serializeTransaction);
}

// Validates status is one of: pending, approved, rejected
function validateStatus(status) {
  if (!ALLOWED_STATUS.has(status)) {
    throw new Error(
      `Invalid status "${status}". Must be one of: ${[...ALLOWED_STATUS].join(
        ", "
      )}`
    );
  }
}

// Adds date range filter to query if start/end epochs provided
function addDateRangeFilter(query, startEpoch, endEpoch) {
  if (startEpoch !== null || endEpoch !== null) {
    query.createdAtEpoch = {};
    if (startEpoch !== null) query.createdAtEpoch.$gte = startEpoch;
    if (endEpoch !== null) query.createdAtEpoch.$lte = endEpoch;
  }
}

// Parses pagination cursor (format: "epoch:_id") for newest-first sorting
function parsePaginationCursor(cursor) {
  if (!cursor) return null;
  const [epochStr, idStr] = String(cursor).split(":");
  const epoch = Number(epochStr);
  if (Number.isNaN(epoch)) {
    throw new Error("Invalid cursor format");
  }
  const _id = toObjectId(idStr, "cursor._id");
  return {
    $or: [
      { createdAtEpoch: { $lt: epoch } },
      { createdAtEpoch: epoch, _id: { $lt: _id } },
    ],
  };
}

// Creates pagination cursor from last document in result set
function createPaginationCursor(lastDoc) {
  if (!lastDoc) return null;
  return `${lastDoc.createdAtEpoch}:${lastDoc._id.toString()}`;
}

// Ensures limit is within acceptable bounds
function normalizeLimit(limit) {
  return Math.max(1, Math.min(limit || DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT));
}

/* =============================================================================
 * CORE QUERY FUNCTIONS
 * ========================================================================== */

// Flexible query builder for listing transactions with pagination
async function queryTransactions(filters = {}) {
  const {
    status = null,
    userId = null,
    reviewedBy = null,
    startEpoch = null,
    endEpoch = null,
    limit = DEFAULT_PAGE_LIMIT,
    after = null,
    projection = null,
  } = filters;

  const query = {};

  // Add filters
  if (status) {
    validateStatus(status);
    query.status = status;
  }
  if (userId) query.userId = toObjectId(userId, "userId");
  if (reviewedBy) query.reviewedBy = toObjectId(reviewedBy, "reviewedBy");
  addDateRangeFilter(query, startEpoch, endEpoch);

  // Add pagination cursor
  const cursorFilter = parsePaginationCursor(after);
  if (cursorFilter) Object.assign(query, cursorFilter);

  // Execute query
  const safeLimit = normalizeLimit(limit);
  const items = await getTransactionsCollection()
    .find(query, { projection })
    .sort({ createdAtEpoch: -1, _id: -1 })
    .limit(safeLimit)
    .toArray();

  const nextCursor = items.length
    ? createPaginationCursor(items[items.length - 1])
    : null;

  return { items: serializeTransactions(items), nextCursor };
}

// Flexible counter for transactions
async function countTransactions(filters = {}) {
  const {
    status = null,
    userId = null,
    reviewedBy = null,
    startEpoch = null,
    endEpoch = null,
  } = filters;

  const query = {};

  if (status) {
    validateStatus(status);
    query.status = status;
  }
  if (userId) query.userId = toObjectId(userId, "userId");
  if (reviewedBy) query.reviewedBy = toObjectId(reviewedBy, "reviewedBy");
  addDateRangeFilter(query, startEpoch, endEpoch);

  return getTransactionsCollection().countDocuments(query);
}

// Groups transactions by status and returns counts for each
async function countByStatus(filters = {}) {
  const {
    status = null,
    userId = null,
    reviewedBy = null,
    startEpoch = null,
    endEpoch = null,
  } = filters;

  const matchStage = {};

  if (status) {
    validateStatus(status);
    matchStage.status = status;
  }
  if (userId) matchStage.userId = toObjectId(userId, "userId");
  if (reviewedBy) matchStage.reviewedBy = toObjectId(reviewedBy, "reviewedBy");
  addDateRangeFilter(matchStage, startEpoch, endEpoch);

  const pipeline = [];
  if (Object.keys(matchStage).length) {
    pipeline.push({ $match: matchStage });
  }
  pipeline.push(
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  );

  const results = await getTransactionsCollection()
    .aggregate(pipeline)
    .toArray();

  // Convert to friendly object: { pending: 5, approved: 10, rejected: 2 }
  return results.reduce((acc, { _id, count }) => {
    acc[_id] = count;
    return acc;
  }, {});
}

/* =============================================================================
 * CREATE OPERATIONS
 * ========================================================================== */

/**
 * Creates a new transaction in pending status.
 * Automatically adds timestamps and initial status history.
 *
 * Usage: const result = await insertTransaction({ userId, amount, riskLevel, riskFactors, ... });
 * Returns: { id: "...", userId: "...", status: "pending", ... } - full transaction object with id field
 */
export async function insertTransaction(doc) {
  const createdAtEpoch = epochSecondsNow();

  const transaction = {
    ...doc,
    userId: toObjectId(doc.userId, "userId"),
    status: TRANSACTION_STATUS.PENDING,
    createdAtTimeZone: doc.createdAtTimeZone || undefined,
    createdAtEpoch,
    statusUpdatedAtEpoch: createdAtEpoch,
    riskLevel: doc.riskLevel || "low",
    riskFactors: doc.riskFactors || [],
    statusHistory: [
      {
        status: TRANSACTION_STATUS.PENDING,
        at: createdAtEpoch,
        by: null,
        reason: null,
      },
    ],
  };

  const result = await getTransactionsCollection().insertOne(transaction);

  // Return the created transaction with id field
  return serializeTransaction({
    _id: result.insertedId,
    ...transaction,
  });
}

/* =============================================================================
 * READ OPERATIONS - Get Single Transaction
 * ========================================================================== */

/**
 * Fetches a single transaction by ID.
 *
 * Usage: const txn = await getTransactionById("507f1f77bcf86cd799439011", { projection: PROJECTIONS.DETAIL_PUBLIC });
 * Returns: Transaction object with id field, or null if not found
 */
export async function getTransactionById(id, { projection } = {}) {
  const doc = await getTransactionsCollection().findOne(
    { _id: toObjectId(id, "id") },
    { projection }
  );
  return serializeTransaction(doc);
}

/* =============================================================================
 * READ OPERATIONS - List Transactions (Paginated)
 * All list functions return: { items: [...], nextCursor: "epoch:id" }
 * Pass nextCursor to 'after' parameter for next page
 * ========================================================================== */

/**
 * Gets all transactions (system-wide) with optional filters.
 * Use for admin/employee dashboards and review queues.
 */
export async function getAllTransactions(options = {}) {
  return queryTransactions(options);
}

/**
 * Gets all transactions for a specific user (newest first).
 */
export async function getTransactionsMadeByUser(userId, options = {}) {
  return queryTransactions({ userId, ...options });
}

/**
 * Gets user's transactions filtered by status.
 */
export async function getTransactionsMadeByUserByStatus(
  userId,
  status,
  options = {}
) {
  return queryTransactions({ userId, status, ...options });
}

/**
 * Gets all transactions reviewed by an employee.
 */
export async function getTransactionsReviewedByEmployee(
  employeeId,
  options = {}
) {
  return queryTransactions({ reviewedBy: employeeId, ...options });
}

/**
 * Gets employee's reviewed transactions filtered by status.
 */
export async function getTransactionsReviewedByEmployeeByStatus(
  employeeId,
  status,
  options = {}
) {
  return queryTransactions({ reviewedBy: employeeId, status, ...options });
}

/* =============================================================================
 * READ OPERATIONS - Count Transactions
 * ========================================================================== */

export async function countTransactionsByStatus(options = {}) {
  return countByStatus(options);
}

export async function countTotalPendingTransactions(options = {}) {
  return countTransactions({ status: TRANSACTION_STATUS.PENDING, ...options });
}

export async function countTransactionsMadeByUser(userId, options = {}) {
  return countTransactions({ userId, ...options });
}

export async function countTransactionsMadeByUserByStatus(
  userId,
  options = {}
) {
  return countByStatus({ userId, ...options });
}

export async function countTransactionsReviewedByEmployee(
  employeeId,
  options = {}
) {
  return countTransactions({ reviewedBy: employeeId, ...options });
}

export async function countTransactionsReviewedByEmployeeByStatus(
  employeeId,
  options = {}
) {
  return countByStatus({ reviewedBy: employeeId, ...options });
}

/* =============================================================================
 * UPDATE OPERATIONS
 * ========================================================================== */

/**
 * Approves or rejects a pending transaction.
 * Only works on transactions with "pending" status.
 *
 * Usage:
 *   const updated = await updateTransactionStatus(id, "approved", employeeId, "ok", {
 *     returnProjection: PROJECTIONS.DETAIL_INTERNAL
 *   });
 * Returns: Updated transaction with id field, or null if not found/not pending
 */
export async function updateTransactionStatus(
  id,
  status,
  employeeId,
  reviewReason,
  { returnProjection } = {}
) {
  if (!ALLOWED_STATUS.has(status) || status === TRANSACTION_STATUS.PENDING) {
    throw new Error(
      `Status must be "${TRANSACTION_STATUS.APPROVED}" or "${TRANSACTION_STATUS.REJECTED}"`
    );
  }

  const nowEpoch = epochSecondsNow();
  const reviewerObjectId = employeeId
    ? toObjectId(employeeId, "employeeId")
    : null;

  // Build the update operation correctly
  const updateOp = {
    $set: {
      status,
      statusUpdatedAtEpoch: nowEpoch,
      reviewedBy: reviewerObjectId,
      ...(status === TRANSACTION_STATUS.REJECTED
        ? { reviewReason: reviewReason ?? "unspecified" }
        : {}),
    },
    $push: {
      statusHistory: {
        status,
        at: nowEpoch,
        by: reviewerObjectId,
        reason: reviewReason ?? null,
      },
    },
  };

  // Only add $unset if approving (to remove rejection reason from previous review)
  if (status === TRANSACTION_STATUS.APPROVED) {
    updateOp.$unset = { reviewReason: 1 };
  }

  const queryFilter = {
    _id: toObjectId(id, "id"),
  };

  const options = {
    returnDocument: "after",
  };

  // Only add projection if explicitly provided (undefined causes issues)
  if (returnProjection) {
    options.projection = returnProjection;
  }

  const result = await getTransactionsCollection().findOneAndUpdate(
    queryFilter,
    updateOp,
    options
  );

  if (!result) {
    logger.warn("Transaction not found for status update", {
      transactionId: id,
      targetStatus: status,
    });
  }

  return serializeTransaction(result); // MongoDB v4+ returns document directly, not wrapped in .value
}

/* =============================================================================
 * TRANSACTION DOCUMENT SCHEMA (Reference)
 * ========================================================================== */
/**
 * {
 *   _id: ObjectId,
 *   userId: ObjectId,
 *   amount: Number,
 *   currencyCode: String,
 *   beneficiaryType: "Individual" | "Business",
 *   beneficiaryFullName: String,
 *   beneficiaryNote?: String,
 *   destinationCountryCode: String,
 *   destinationBankName: String,
 *   destinationBankSwift: String,
 *   destinationAccountNumber: String,
 *   status: "pending" | "approved" | "rejected",
 *   createdAtEpoch: Number,
 *   statusUpdatedAtEpoch: Number,
 *   createdAtTimeZone?: String,
 *   riskLevel: "low" | "medium" | "high",
 *   riskFactors: Array<String>,
 *   reviewedBy?: ObjectId | null,
 *   reviewReason?: String | null,
 *   metadata?: Object,
 *   statusHistory?: Array<{ status: String, at: Number, by: ObjectId|null, reason: String|null }>
 * }
 */
