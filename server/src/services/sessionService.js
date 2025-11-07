// --- Imports ---
import { getLogger } from "#utils/logger.js";

// --- Logger ---
const logger = getLogger(import.meta.url);

// --- Express Session Management ---

/**
 * Regenerates the session and sets user data.
 * @param {object} req - Express request object
 * @param {object} user - User object (must have id and role)
 * @returns {string} sessionID
 */
export async function createSession(req, user) {
  // Promisify session.regenerate for async/await
  await new Promise((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });
  logger.debug(`Session created for user ${user.id} with role: ${user.role}`);
  req.session.userId = user.id;
  req.session.role = user.role;
  return req.sessionID;
}

/**
 * Destroys the session and clears the cookie.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function destroySession(req, res) {
  // Promisify session.destroy for async/await
  await new Promise((resolve, reject) => {
    req.session.destroy((err) => (err ? reject(err) : resolve()));
  });
  // Only clear cookie if response headers still open
  if (res && !res.headersSent) {
    res.clearCookie("sid");
  }
}

/**
 * Fetch a session object by current request sessionID.
 * Returns null if lookup fails or has no userId.
 * @param {object} req - Express request
 * @returns {Promise<object|null>}
 */
export function fetchSession(req) {
  const sessionId = req.sessionID;
  return new Promise((resolve) => {
    req.sessionStore.get(sessionId, (err, session) => {
      if (err || !session) return resolve(null);
      resolve(session);
    });
  });
}
