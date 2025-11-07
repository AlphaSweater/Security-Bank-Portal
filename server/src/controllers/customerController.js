import { getLogger } from "#utils/logger.js";
import * as customerService from "#services/customerService.js";
import * as transactionService from "#services/transactionService.js";

const logger = getLogger(import.meta.url);

/* =============================================================================
 * CUSTOMER CONTROLLER - Customer-Facing Operations
 * Handles customer dashboards, transaction viewing, and statistics
 * ========================================================================== */

// GET /api/customers/dashboard - Get customer dashboard with recent transactions
export async function getCustomerDashboard(req, res) {
  res.set({ "Cache-Control": "no-store" });
  const userId = req.session?.userId;

  // Pagination options from query params
  const options = {
    limit: parseInt(req.query.limit) || 25,
    after: req.query.after,
    status: req.query.status,
  };

  try {
    const dashboard = await customerService.getCustomerDashboard(
      userId,
      options
    );

    logger.debug("Retrieved customer dashboard", {
      userId,
      totalTransactions: dashboard.summary.total,
    });

    return res.json(dashboard);
  } catch (err) {
    logger.error("Failed to fetch customer dashboard", {
      error: err.message,
      userId,
    });
    return res.status(500).json({ message: "Failed to fetch dashboard" });
  }
}

// GET /api/customers/transactions - Get customer's transactions with filtering
export async function getMyTransactions(req, res) {
  res.set({ "Cache-Control": "no-store" });
  const userId = req.session?.userId;

  // Filter and pagination options from query params
  const options = {
    status: req.query.status,
    limit: parseInt(req.query.limit) || 25,
    after: req.query.after,
    startEpoch: req.query.startEpoch
      ? parseInt(req.query.startEpoch)
      : undefined,
    endEpoch: req.query.endEpoch ? parseInt(req.query.endEpoch) : undefined,
  };

  try {
    const transactions = await transactionService.getUserTransactions(
      userId,
      options
    );

    logger.debug("Retrieved customer transactions", {
      userId,
      count: transactions.items.length,
      status: options.status || "all",
    });

    return res.json(transactions);
  } catch (err) {
    logger.error("Failed to fetch customer transactions", {
      error: err.message,
      userId,
    });
    return res.status(500).json({ message: "Failed to fetch transactions" });
  }
}

// GET /api/customers/transactions/:id - Get single transaction details
export async function getTransactionById(req, res) {
  res.set({ "Cache-Control": "no-store" });
  const userId = req.session?.userId;
  const { id } = req.params;

  try {
    const transaction = await transactionService.getUserTransactionById(id);

    if (!transaction) {
      logger.warn("Transaction not found", { transactionId: id, userId });
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Verify ownership - customers can only view their own transactions
    if (transaction.userId !== userId) {
      logger.warn("Unauthorized transaction access attempt", {
        transactionId: id,
        userId,
        ownerId: transaction.userId,
      });
      return res.status(403).json({ message: "Access denied" });
    }

    logger.debug("Retrieved transaction details", {
      transactionId: id,
      userId,
    });
    return res.json({ transaction });
  } catch (err) {
    logger.error("Failed to fetch transaction", {
      error: err.message,
      transactionId: id,
      userId,
    });
    return res.status(500).json({ message: "Failed to fetch transaction" });
  }
}

// GET /api/customers/stats - Get customer transaction statistics
export async function getMyTransactionStats(req, res) {
  res.set({ "Cache-Control": "no-store" });
  const userId = req.session?.userId;
  const period = req.query.period || "day"; // day, week, month, year

  try {
    const stats = await customerService.getCustomerTransactionStats(
      userId,
      period
    );

    logger.debug("Retrieved customer transaction stats", {
      userId,
      period,
      count: stats.count,
    });

    return res.json({
      period,
      stats,
    });
  } catch (err) {
    logger.error("Failed to fetch customer stats", {
      error: err.message,
      userId,
      period,
    });
    return res.status(500).json({ message: "Failed to fetch statistics" });
  }
}

// POST /api/customers/transactions - Create new transaction
export async function createTransaction(req, res) {
  res.set({ "Cache-Control": "no-store" });
  const userId = req.session?.userId;
  // req.body already validated by Joi middleware

  const payload = {
    ...req.body,
    userId, // Ensure userId comes from session, not request body
  };

  try {
    const result = await transactionService.createTransaction(payload);

    logger.info("Transaction created", {
      transactionId: result.transactionId.toString(),
      userId,
      amount: payload.amount,
      riskLevel: result.riskLevel,
    });

    return res.status(201).json({
      message: result.message,
      transactionId: result.transactionId,
      status: result.status,
      riskLevel: result.riskLevel,
    });
  } catch (err) {
    logger.error("Failed to create transaction", {
      error: err.message,
      userId,
    });
    return res.status(500).json({ message: "Failed to create transaction" });
  }
}
