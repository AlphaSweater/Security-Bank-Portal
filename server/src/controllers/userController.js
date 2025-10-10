// server/src/controllers/userController.js
import { getLogger } from "#utils/logger.js";
import { getBasicUserInfo } from "#services/userService.js";
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

// GET /api/users/me
export async function getMyProfile(req, res) {
  res.set({ "Cache-Control": "no-store" });
  const userId = req.session?.userId;
  try {
    const user = await getBasicUserInfo(userId);
    return res.json({ user });
  } catch (err) {
    logger.error({ err }, "Failed to fetch user profile");
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
}
