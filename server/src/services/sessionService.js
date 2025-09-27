import { getLogger } from "#utils/logger.js";
const logger = getLogger(import.meta.url);

/**
 * Regenerates the session and sets user data.
 */
export async function createSession(req, user) {
  // Promisify session.regenerate for async/await
  await new Promise((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });
  logger.debug(`Session created for user ${user._id} with role: ${user.role}`);
  req.session.userId = user._id;
  req.session.role = user.role;
  return req.sessionID;
}

/**
 * Destroys the session and clears the cookie.
 */
export async function destroySession(req, res) {
  // Promisify session.destroy for async/await
  await new Promise((resolve, reject) => {
    req.session.destroy((err) => (err ? reject(err) : resolve()));
  });
  res.clearCookie("sid");
}
