// transactionsModel.js
import { getDB } from "#config/mongoDBConfig.js";
import { ObjectId } from "mongodb";
import { epochSecondsNow } from "#utils/timeUtil.js";

// =============================================================================
// CONSTANTS
// =============================================================================

export const TRANSACTION_STATUS = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
});
const ALLOWED_STATUS = new Set(Object.values(TRANSACTION_STATUS));

// =============================================================================
// COLLECTION ACCESSOR
// =============================================================================

const collection = () => getDB().collection("transactions");

// =============================================================================
// HELPERS (local + readable)
// =============================================================================

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

// =============================================================================
// OPTIONAL: INDEX BOOTSTRAP
// =============================================================================

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

// =============================================================================
// CREATE
// =============================================================================

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

// =============================================================================
// READ — CORE LIST (newest first)
// =============================================================================

export async function listTransactions({
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

// =============================================================================
// READ — CONVENIENCE LIST ACCESSORS
// =============================================================================

export async function getTransactionsByUser(
  userId,
  {
    startEpoch = null,
    endEpoch = null,
    limit = 50,
    after = null,
    projection,
  } = {}
) {
  return listTransactions({
    userId,
    startEpoch,
    endEpoch,
    limit,
    after,
    projection,
  });
}

export async function getTransactionsByStatus(
  status,
  {
    userId = null,
    reviewedBy = null,
    startEpoch = null,
    endEpoch = null,
    limit = 50,
    after = null,
    projection,
  } = {}
) {
  return listTransactions({
    status,
    userId,
    reviewedBy,
    startEpoch,
    endEpoch,
    limit,
    after,
    projection,
  });
}

export async function getPendingTransactions({
  userId = null,
  startEpoch = null,
  endEpoch = null,
  limit = 50,
  after = null,
  projection,
} = {}) {
  return listTransactions({
    status: TRANSACTION_STATUS.PENDING,
    userId,
    startEpoch,
    endEpoch,
    limit,
    after,
    projection,
  });
}

export async function getTransactionsReviewedByEmployee(
  employeeId,
  {
    status = null,
    startEpoch = null,
    endEpoch = null,
    limit = 50,
    after = null,
    projection,
  } = {}
) {
  return listTransactions({
    reviewedBy: employeeId,
    status,
    startEpoch,
    endEpoch,
    limit,
    after,
    projection,
  });
}

// =============================================================================
// READ — SINGLE DOC
// =============================================================================

export async function getTransactionById(id, { projection } = {}) {
  return collection().findOne(
    { _id: toObjectIdOrThrow(id, "id") },
    { projection }
  );
}

// =============================================================================
// COUNT — CORE TOTAL + CORE GROUPED
// =============================================================================

/**
 * countTransactions — total count matching filters (mirrors listTransactions filters).
 * @returns {Promise<number>}
 */
export async function countTransactions({
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

/**
 * countTransactionsByStatus — grouped counts matching filters.
 * Returns: { pending: n, approved: n, rejected: n } (missing keys omitted)
 * @returns {Promise<Object>}
 */
export async function countTransactionsByStatus({
  userId = null,
  reviewedBy = null,
  startEpoch = null,
  endEpoch = null,
  // Optional pre-filter by a single status if you want a subset; null = all
  status = null,
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

// =============================================================================
// COUNT — CONVENIENCE ACCESSORS (thin wrappers)
// =============================================================================

/**
 * Total number of pending transactions, optionally within a time window or for a user.
 */
export async function countPendingTransactions({
  userId = null,
  startEpoch = null,
  endEpoch = null,
} = {}) {
  return countTransactions({
    status: TRANSACTION_STATUS.PENDING,
    userId,
    startEpoch,
    endEpoch,
  });
}

/**
 * Total number of transactions for a user (any status), with optional time range.
 */
export async function countUserTransactions(
  userId,
  { startEpoch = null, endEpoch = null, status = null } = {}
) {
  return countTransactions({ userId, startEpoch, endEpoch, status });
}

/**
 * Count a user's transactions grouped by status (e.g., for a user dashboard).
 */
export async function countUserTransactionsByStatus(
  userId,
  { startEpoch = null, endEpoch = null } = {}
) {
  return countTransactionsByStatus({ userId, startEpoch, endEpoch });
}

/**
 * Total number of transactions reviewed by a specific employee (any status).
 */
export async function countTransactionsReviewedByEmployee(
  employeeId,
  { startEpoch = null, endEpoch = null, status = null } = {}
) {
  return countTransactions({
    reviewedBy: employeeId,
    startEpoch,
    endEpoch,
    status,
  });
}

/**
 * Grouped counts for transactions reviewed by a specific employee (by status).
 */
export async function countTransactionsReviewedByEmployeeByStatus(
  employeeId,
  { startEpoch = null, endEpoch = null, status = null } = {}
) {
  // status param here acts as an optional pre-filter to a single status; omit for all
  return countTransactionsByStatus({
    reviewedBy: employeeId,
    startEpoch,
    endEpoch,
    status,
  });
}

// =============================================================================
// UPDATE
// =============================================================================

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

  return result.value;
}

// =============================================================================
// TRANSACTION DOCUMENT SCHEMA (reference)
// =============================================================================

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
