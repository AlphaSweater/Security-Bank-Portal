// Session service for handling session logic

/**
 * Regenerates the session and sets user data.
 * Uses async/await for clarity.
 * @param {object} req - Express request object
 * @param {object} user - User object to store in session
 * @returns {Promise<string>} Resolves with the new session ID
 */
export async function createSession(req, user) {
  // Promisify session.regenerate for async/await
  await new Promise((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });
  req.session.userId = user.id;
  req.session.roles = user.roles;
  return req.sessionID;
}

/**
 * Destroys the session and clears the cookie.
 * Uses async/await for clarity.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
export async function destroySession(req, res) {
  // Promisify session.destroy for async/await
  await new Promise((resolve, reject) => {
    req.session.destroy((err) => (err ? reject(err) : resolve()));
  });
  res.clearCookie("sid");
}
