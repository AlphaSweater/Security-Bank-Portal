// transactionsModel.js
import { getDB } from "#config/mongoDBConfig.js";
import { ObjectId } from "mongodb";
import { epochSecondsNow } from "#utils/timeUtil.js";

/* =============================================================================
 * CONSTANTS
 * ========================================================================== */

export const TRANSACTION_STATUS = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
});
const ALLOWED_STATUS = new Set(Object.values(TRANSACTION_STATUS));

/* =============================================================================
 * COLLECTION ACCESSOR
 * ========================================================================== */

const collection = () => getDB().collection("transactions");

/* =============================================================================
 * INTERNAL HELPERS (private)
 * ========================================================================== */

function toObjectIdOrThrow(id, fieldName = "id") {
  const value = String(id ?? "");
  if (!/^[a-fA-F0-9]{24}$/.test(value)) {
    throw new Error(`Invalid ObjectId for ${fieldName}: "${id}"`);
  }
  return new ObjectId(value);
}

function addCreatedAtRange(query, startEpoch, endEpoch) {
  if (startEpoch !== null || endEpoch !== null) {
    query.createdAtEpoch = {};
    if (startEpoch !== null) query.createdAtEpoch.$gte = startEpoch;
    if (endEpoch !== null) query.createdAtEpoch.$lte = endEpoch;
  }
}

// Cursor helpers (newest-first): "epoch:_id"
function parseCursor(after) {
  if (!after) return null;
  const [epochStr, idStr] = String(after).split(":");
  const epoch = Number(epochStr);
  const _id = toObjectIdOrThrow(idStr, "afterCursor._id");
  if (Number.isNaN(epoch))
    throw new Error("Invalid cursor: epoch is not a number");
  return {
    $or: [
      { createdAtEpoch: { $lt: epoch } },
      { createdAtEpoch: epoch, _id: { $lt: _id } },
    ],
  };
}
function makeCursor(lastDoc) {
  if (!lastDoc) return null;
  return `${lastDoc.createdAtEpoch}:${lastDoc._id.toString()}`;
}

/* =============================================================================
 * OPTIONAL: INDEX BOOTSTRAP (public)
 * ========================================================================== */

/**
 * ensureTransactionIndexes() → Promise<void>
 * Creates the compound/partial indexes used by your common queries. Call once at server startup.
 */
export async function ensureTransactionIndexes() {
  const col = collection();
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
 * PRIVATE CORES
 * ========================================================================== */

async function _listTransactions({
  status = null,
  userId = null,
  reviewedBy = null,
  startEpoch = null,
  endEpoch = null,
  limit = 50,
  after = null,
  projection,
} = {}) {
  const query = {};
  addCreatedAtRange(query, startEpoch, endEpoch);

  if (status !== null) {
    if (!ALLOWED_STATUS.has(status)) {
      throw new Error(
        `Invalid status "${status}". Allowed: ${[...ALLOWED_STATUS].join(", ")}`
      );
    }
    query.status = status;
  }
  if (userId !== null) query.userId = toObjectIdOrThrow(userId, "userId");
  if (reviewedBy !== null)
    query.reviewedBy = toObjectIdOrThrow(reviewedBy, "reviewedBy");

  const cursorClause = parseCursor(after);
  if (cursorClause) Object.assign(query, cursorClause);

  const safeLimit = Math.max(1, Math.min(limit, 200));
  const cursor = collection()
    .find(query, { projection })
    .sort({ createdAtEpoch: -1, _id: -1 })
    .limit(safeLimit);

  const items = await cursor.toArray();
  const nextCursor = items.length ? makeCursor(items[items.length - 1]) : null;

  return { items, nextCursor };
}

async function _countTransactions({
  status = null,
  userId = null,
  reviewedBy = null,
  startEpoch = null,
  endEpoch = null,
} = {}) {
  const query = {};
  addCreatedAtRange(query, startEpoch, endEpoch);

  if (status !== null) {
    if (!ALLOWED_STATUS.has(status)) {
      throw new Error(
        `Invalid status "${status}". Allowed: ${[...ALLOWED_STATUS].join(", ")}`
      );
    }
    query.status = status;
  }
  if (userId !== null) query.userId = toObjectIdOrThrow(userId, "userId");
  if (reviewedBy !== null)
    query.reviewedBy = toObjectIdOrThrow(reviewedBy, "reviewedBy");

  return collection().countDocuments(query);
}

async function _countTransactionsByStatus({
  status = null, // optional pre-filter to a single status
  userId = null,
  reviewedBy = null,
  startEpoch = null,
  endEpoch = null,
} = {}) {
  const matchStage = {};
  addCreatedAtRange(matchStage, startEpoch, endEpoch);
  if (userId !== null) matchStage.userId = toObjectIdOrThrow(userId, "userId");
  if (reviewedBy !== null)
    matchStage.reviewedBy = toObjectIdOrThrow(reviewedBy, "reviewedBy");
  if (status !== null) {
    if (!ALLOWED_STATUS.has(status)) {
      throw new Error(
        `Invalid status "${status}". Allowed: ${[...ALLOWED_STATUS].join(", ")}`
      );
    }
    matchStage.status = status;
  }

  const pipeline = [];
  if (Object.keys(matchStage).length) pipeline.push({ $match: matchStage });
  pipeline.push(
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  );

  const results = await collection().aggregate(pipeline).toArray();
  return results.reduce((acc, { _id, count }) => {
    acc[_id] = count;
    return acc;
  }, {});
}

/* =============================================================================
 * PUBLIC API — CREATE
 * ========================================================================== */

/**
 * insertTransaction(doc) → Promise<InsertOneResult>
 * Creates a new transaction with canonical timestamps, pending status, and an initial statusHistory entry.
 * Pass a validated business doc (must include userId).
 */
export async function insertTransaction(doc) {
  const createdAtEpoch = epochSecondsNow();

  const transaction = {
    ...doc,
    userId: toObjectIdOrThrow(doc.userId, "userId"),
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

  return collection().insertOne(transaction);
}

/* =============================================================================
 * PUBLIC API — READ (lists) — all return { items, nextCursor }, newest-first
 * ========================================================================== */

/**
 * getTransactionsMadeByUser(userId, { startEpoch, endEpoch, limit, after, projection })
 * Lists all transactions for a user, newest first. Optional time window + cursor pagination.
 */
export async function getTransactionsMadeByUser(
  userId,
  {
    startEpoch = null,
    endEpoch = null,
    limit = 50,
    after = null,
    projection,
  } = {}
) {
  return _listTransactions({
    userId,
    startEpoch,
    endEpoch,
    limit,
    after,
    projection,
  });
}

/**
 * getTransactionsMadeByUserByStatus(userId, { status, startEpoch, endEpoch, limit, after, projection })
 * Lists a user's transactions filtered by a given status.
 */
export async function getTransactionsMadeByUserByStatus(
  userId,
  status,
  {
    startEpoch = null,
    endEpoch = null,
    limit = 50,
    after = null,
    projection,
  } = {}
) {
  return _listTransactions({
    userId,
    status,
    startEpoch,
    endEpoch,
    limit,
    after,
    projection,
  });
}

/**
 * getTransactionsReviewedByEmployee(employeeId, { status, startEpoch, endEpoch, limit, after, projection })
 * Lists transactions reviewed by a given employee, optionally filtered by status and/or time window.
 */
export async function getTransactionsReviewedByEmployee(
  employeeId,
  {
    startEpoch = null,
    endEpoch = null,
    limit = 50,
    after = null,
    projection,
  } = {}
) {
  return _listTransactions({
    reviewedBy: employeeId,
    startEpoch,
    endEpoch,
    limit,
    after,
    projection,
  });
}

/**
 * getTransactionsReviewedByEmployeeByStatus(employeeId, { status, startEpoch, endEpoch, limit, after, projection })
 * Lists transactions reviewed by a given employee filtered by a specific status.
 */
export async function getTransactionsReviewedByEmployeeByStatus(
  employeeId,
  status,
  {
    startEpoch = null,
    endEpoch = null,
    limit = 50,
    after = null,
    projection,
  } = {}
) {
  return _listTransactions({
    reviewedBy: employeeId,
    status,
    startEpoch,
    endEpoch,
    limit,
    after,
    projection,
  });
}

/**
 * getTransactionById(id, { projection })
 * Fetches a single transaction by its _id.
 */
export async function getTransactionById(id, { projection } = {}) {
  return collection().findOne(
    { _id: toObjectIdOrThrow(id, "id") },
    { projection }
  );
}

/* =============================================================================
 * PUBLIC API — READ (counts)
 * ========================================================================== */

/**
 * countTransactionsByStatus({ startEpoch=null, endEpoch=null } = {})
 * Global grouped counts by status (optionally by period).
 * Returns: { pending: n, approved: n, rejected: n } (missing keys omitted)
 */
export async function countTransactionsByStatus({
  startEpoch = null,
  endEpoch = null,
} = {}) {
  return _countTransactionsByStatus({ startEpoch, endEpoch });
}

/**
 * countTotalPendingTransactions({ userId=null, startEpoch=null, endEpoch=null } = {})
 * Counts pending transactions, optionally for a specific user and/or period.
 */
export async function countTotalPendingTransactions({
  userId = null,
  startEpoch = null,
  endEpoch = null,
} = {}) {
  return _countTransactions({
    status: TRANSACTION_STATUS.PENDING,
    userId,
    startEpoch,
    endEpoch,
  });
}

/**
 * countUserMadeTransactions(userId, { status=null, startEpoch=null, endEpoch=null } = {})
 * Total count for a user (optionally restricted to a status or time window).
 */
export async function countUserMadeTransactions(
  userId,
  { status = null, startEpoch = null, endEpoch = null } = {}
) {
  return _countTransactions({ userId, status, startEpoch, endEpoch });
}

/**
 * countUserMadeTransactionsByStatus(userId, { startEpoch=null, endEpoch=null } = {})
 * Grouped counts for a user by status.
 */
export async function countUserMadeTransactionsByStatus(
  userId,
  { startEpoch = null, endEpoch = null } = {}
) {
  return _countTransactionsByStatus({ userId, startEpoch, endEpoch });
}

/**
 * countEmployeeReviewedTransactions(employeeId, { status=null, startEpoch=null, endEpoch=null } = {})
 * Total transactions reviewed by an employee, optionally by status/time.
 */
export async function countEmployeeReviewedTransactions(
  employeeId,
  { status = null, startEpoch = null, endEpoch = null } = {}
) {
  return _countTransactions({
    reviewedBy: employeeId,
    status,
    startEpoch,
    endEpoch,
  });
}

/**
 * countEmployeeReviewedTransactionsByStatus(employeeId, { startEpoch=null, endEpoch=null, status=null } = {})
 * Grouped counts by status for an employee’s reviewed transactions.
 */
export async function countEmployeeReviewedTransactionsByStatus(
  employeeId,
  { startEpoch = null, endEpoch = null, status = null } = {}
) {
  return _countTransactionsByStatus({
    reviewedBy: employeeId,
    startEpoch,
    endEpoch,
    status,
  });
}

/* =============================================================================
 * PUBLIC API — UPDATE
 * ========================================================================== */

/**
 * updateTransactionStatus(id, status, employeeId, reviewReason) → Promise<Object|null>
 * Approves or rejects a pending transaction, sets metadata (reviewedBy, statusUpdatedAtEpoch, reviewReason),
 * appends statusHistory, and returns the updated document. Guards: only pending → approved|rejected.
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
    ? toObjectIdOrThrow(employeeId, "employeeId")
    : null;

  const result = await collection().findOneAndUpdate(
    { _id: toObjectIdOrThrow(id, "id"), status: TRANSACTION_STATUS.PENDING },
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
 * TRANSACTION DOCUMENT SCHEMA (reference)
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
