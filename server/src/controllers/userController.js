// server/src/controllers/userController.js
import { getLogger } from "#utils/logger.js";
const logger = getLogger(import.meta.url);

// Get current user info
export const getMe = (req, res) => {
  res.json({ userId: req.session.userId, roles: req.session.roles });
};

// Dashboard route
export const getDashboard = (req, res) => {
  res.json({ message: "Welcome to your dashboard!" });
};

// Admin-only data
export const getAdminData = (req, res) => {
  res.json({ secret: "This is admin-only data" });
};
