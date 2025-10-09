import {
  createTransaction as createTxn,
  listUserTransactions,
  listPendingTransactions,
  updateTransactionStatus as updateTxnStatus,
} from "#services/transactionService.js";
import { getLogger } from "#utils/logger.js";

const logger = getLogger(import.meta.url);

// POST /api/transactions
export async function createTransaction(req, res) {
  res.set({ "Cache-Control": "no-store" });
  // req.body already validated by Joi; userId injected by route middleware
  const doc = req.body;
  try {
    const insertedId = await createTxn(doc);
    return res
      .status(201)
      .json({ message: "Transaction created", transactionId: insertedId });
  } catch (err) {
    logger.error({ err }, "Failed to create transaction");
    return res.status(500).json({ message: "Failed to create transaction" });
  }
}

// GET /api/users/me/transactions (moved to userController)
export async function getMyTransactions(req, res) {
  res.set({ "Cache-Control": "no-store" });
  const userId = req.session?.userId;
  try {
    const txns = await listUserTransactions(userId);
    return res.json({ items: txns });
  } catch (err) {
    logger.error({ err }, "Failed to fetch user transactions");
    return res.status(500).json({ message: "Failed to fetch transactions" });
  }
}

// GET /api/transactions/pending
export async function getAllPending(req, res) {
  res.set({ "Cache-Control": "no-store" });
  try {
    const txns = await listPendingTransactions();
    return res.json({ items: txns });
  } catch (err) {
    logger.error({ err }, "Failed to fetch pending transactions");
    return res.status(500).json({ message: "Failed to fetch transactions" });
  }
}

// PATCH /api/transactions/status
export async function setTransactionStatus(req, res) {
  res.set({ "Cache-Control": "no-store" });
  const { id } = req.params; // validated by params schema
  const { status, reviewReason } = req.body; // validated by body schema
  const employeeId = req.session?.userId; // source of truth for reviewer
  try {
    const result = await updateTxnStatus({
      id,
      status,
      reviewerUserId: employeeId,
      reviewReason,
    });
    if (result.matched === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    return res.json({ message: "Status updated" });
  } catch (err) {
    logger.error({ err }, "Failed to update transaction status");
    return res.status(500).json({ message: "Failed to update status" });
  }
}
