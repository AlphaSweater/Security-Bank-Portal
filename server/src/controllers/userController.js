// server/src/controllers/userController.js
import { getLogger } from "#utils/logger.js";
import { listUserTransactions } from "#services/transactionService.js";

const logger = getLogger(import.meta.url);

// GET /api/users/me/transactions
export async function getMyTransactions(req, res) {
  res.set({ "Cache-Control": "no-store" });
  const userId = req.session?.userId;
  try {
    const items = await listUserTransactions(userId);
    return res.json({ items: items });
  } catch (err) {
    logger.error({ err }, "Failed to fetch user transactions");
    return res.status(500).json({ message: "Failed to fetch transactions" });
  }
}
