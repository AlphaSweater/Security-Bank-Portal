// transactionsModel.js
import { getDB } from "#config/mongoDBConfig.js";
import { ObjectId } from "mongodb";
import { epochSecondsNow } from "#utils/timeUtil.js";

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
 * DATABASE SETUP
 * ========================================================================== */

/**
 * Creates database indexes for optimal query performance.
 * Call this once when your server starts up.
 *
 * Usage: await ensureTransactionIndexes();
 */
export async function ensureTransactionIndexes() {
  const col = getTransactionsCollection();
  await col.createIndexes([
    { key: { userId: 1, createdAtEpoch: -1 }, name: "user_created_desc" },
    { key: { status: 1, createdAtEpoch: -1 }, name: "status_created_desc" },
    {
      key: { reviewedBy: 1, createdAtEpoch: -1 },
      name: "reviewer_created_desc",
    },
    {
      key: { createdAtEpoch: -1 },
      name: "pending_created_desc_partial",
      partialFilterExpression: { status: TRANSACTION_STATUS.PENDING },
    },
  ]);
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

  return { items, nextCursor };
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
 * Usage: const result = await insertTransaction({ userId: "123abc...", amount: 500, ... });
 * Returns: MongoDB InsertOneResult with { insertedId, acknowledged }
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
    statusHistory: [
      {
        status: TRANSACTION_STATUS.PENDING,
        at: createdAtEpoch,
        by: null,
        reason: null,
      },
    ],
  };

  return getTransactionsCollection().insertOne(transaction);
}

/* =============================================================================
 * READ OPERATIONS - Get Single Transaction
 * ========================================================================== */

/**
 * Fetches a single transaction by ID.
 *
 * Usage: const txn = await getTransactionById("507f1f77bcf86cd799439011");
 * Returns: Transaction object or null if not found
 */
export async function getTransactionById(id, { projection } = {}) {
  return getTransactionsCollection().findOne(
    { _id: toObjectId(id, "id") },
    { projection }
  );
}

/* =============================================================================
 * READ OPERATIONS - List Transactions (Paginated)
 * All list functions return: { items: [...], nextCursor: "epoch:id" }
 * Pass nextCursor to 'after' parameter for next page
 * ========================================================================== */

/**
 * Gets all transactions for a specific user (newest first).
 *
 * Usage: const { items, nextCursor } = await getTransactionsMadeByUser("507f...", { limit: 20 });
 * Returns: { items: [transaction objects], nextCursor: "string or null" }
 */
export async function getTransactionsMadeByUser(userId, options = {}) {
  return queryTransactions({ userId, ...options });
}

/**
 * Gets user's transactions filtered by status.
 *
 * Usage: const { items } = await getTransactionsMadeByUserByStatus("507f...", "pending");
 * Returns: { items: [transaction objects], nextCursor: "string or null" }
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
 *
 * Usage: const { items } = await getTransactionsReviewedByEmployee("507f...");
 * Returns: { items: [transaction objects], nextCursor: "string or null" }
 */
export async function getTransactionsReviewedByEmployee(
  employeeId,
  options = {}
) {
  return queryTransactions({ reviewedBy: employeeId, ...options });
}

/**
 * Gets employee's reviewed transactions filtered by status.
 *
 * Usage: const { items } = await getTransactionsReviewedByEmployeeByStatus("507f...", "approved");
 * Returns: { items: [transaction objects], nextCursor: "string or null" }
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

/**
 * Counts all transactions grouped by status.
 *
 * Usage: const counts = await countTransactionsByStatus();
 * Returns: { pending: 5, approved: 10, rejected: 2 }
 */
export async function countTransactionsByStatus(options = {}) {
  return countByStatus(options);
}

/**
 * Counts all pending transactions (optionally for a specific user).
 *
 * Usage: const count = await countTotalPendingTransactions();
 * Returns: Number (e.g., 42)
 */
export async function countTotalPendingTransactions(options = {}) {
  return countTransactions({ status: TRANSACTION_STATUS.PENDING, ...options });
}

/**
 * Counts total transactions made by a user (optionally by status).
 *
 * Usage: const count = await countUserMadeTransactions("507f...", { status: "approved" });
 * Returns: Number (e.g., 15)
 */
export async function countTransactionsMadeByUser(userId, options = {}) {
  return countTransactions({ userId, ...options });
}

/**
 * Counts user's transactions grouped by status.
 *
 * Usage: const counts = await countUserMadeTransactionsByStatus("507f...");
 * Returns: { pending: 2, approved: 8, rejected: 1 }
 */
export async function countTransactionsMadeByUserByStatus(
  userId,
  options = {}
) {
  return countByStatus({ userId, ...options });
}

/**
 * Counts total transactions reviewed by an employee (optionally by status).
 *
 * Usage: const count = await countEmployeeReviewedTransactions("507f...");
 * Returns: Number (e.g., 89)
 */
export async function countTransactionsReviewedByEmployee(
  employeeId,
  options = {}
) {
  return countTransactions({ reviewedBy: employeeId, ...options });
}

/**
 * Counts employee's reviewed transactions grouped by status.
 *
 * Usage: const counts = await countEmployeeReviewedTransactionsByStatus("507f...");
 * Returns: { approved: 45, rejected: 12 }
 */
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
 * Usage: const updated = await updateTransactionStatus("507f...", "approved", "employeeId123");
 * Returns: Updated transaction object or null if not found/not pending
 */
export async function updateTransactionStatus(
  id,
  status,
  employeeId,
  reviewReason
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

  const result = await getTransactionsCollection().findOneAndUpdate(
    { _id: toObjectId(id, "id"), status: TRANSACTION_STATUS.PENDING },
    {
      $set: {
        status,
        statusUpdatedAtEpoch: nowEpoch,
        reviewedBy: reviewerObjectId,
        ...(status === TRANSACTION_STATUS.REJECTED
          ? { reviewReason: reviewReason ?? "unspecified" }
          : {}),
      },
      ...(status === TRANSACTION_STATUS.APPROVED
        ? { $unset: { reviewReason: "" } }
        : {}),
      $push: {
        statusHistory: {
          status,
          at: nowEpoch,
          by: reviewerObjectId,
          reason: reviewReason ?? null,
        },
      },
    },
    { returnDocument: "after" }
  );

  return result.value; // null if not found or not pending
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
 *   reviewedBy?: ObjectId | null,
 *   reviewReason?: String | null,
 *   statusHistory?: Array<{ status: String, at: Number, by: ObjectId|null, reason: String|null }>
 * }
 */
