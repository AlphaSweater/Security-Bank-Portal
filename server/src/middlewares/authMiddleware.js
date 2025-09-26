import { getLogger } from "#utils/logger.js";
const logger = getLogger(import.meta.url);

/**
 * Middleware to protect routes that require authentication.
 *
 * How it works:
 * - Checks if req.session.userId exists (set after login)
 * - If present, user is authenticated and request continues
 * - If not, responds with 401 Unauthorized
 *
 * Usage: app.get('/protected', requireAuth, handler)
 */
export default function requireAuth(req, res, next) {
  // If the session contains a userId, the user is logged in
  if (req.session?.userId) {
    return next();
  }
  // Log unauthorized access attempts for auditing (optional, but useful)
  logger.warn(`Unauthorized access attempt from IP: ${req.ip}`);
  // Respond with 401 if not authenticated
  return res.status(401).json({ message: "Unauthorized" });
}
