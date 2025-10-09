import * as transactionRepo from "#models/transactionModel.js";
import { getLogger } from "#utils/logger.js";

const logger = getLogger(import.meta.url);

/**
 * Creates a transaction from a validated payload.
 * Expects userId to be a 24-char hex string and other fields validated upstream.
 */
export async function createTransaction(payload) {
  // Any additional business rules could be applied here in the future.
  const result = await transactionRepo.insertTransaction(payload);
  return result.insertedId;
}

/**
 * Returns all transactions for a given userId (string).
 */
export async function listUserTransactions(userId) {
  if (!userId) return [];
  return await transactionRepo.getTransactionsByUserId(userId);
}

/**
 * Returns all pending transactions for employee/admin dashboards.
 */
export async function listPendingTransactions() {
  return await transactionRepo.getPendingTransactions();
}

/**
 * Updates a transaction status and reviewer.
 */
export async function updateTransactionStatus({
  id,
  status,
  reviewerUserId,
  reviewReason,
}) {
  const result = await transactionRepo.updateTransactionStatus(
    id,
    status,
    reviewerUserId,
    reviewReason
  );
  return {
    matched: result.matchedCount || 0,
    modified: result.modifiedCount || 0,
  };
}
