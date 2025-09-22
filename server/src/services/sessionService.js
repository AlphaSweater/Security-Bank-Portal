// Session service for handling session logic

/**
 * Regenerates the session and sets user data.
 * @param {object} req - Express request object
 * @param {object} user - User object to store in session
 * @returns {Promise<string>} Resolves with the new session ID
 */
export function createSession(req, user) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) return reject(error);
      req.session.userId = user.id;
      req.session.roles = user.roles;
      resolve(req.sessionID);
    });
  });
}

/**
 * Destroys the session and clears the cookie.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
export function destroySession(req, res) {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => {
      if (error) return reject(error);
      res.clearCookie("sid");
      resolve();
    });
  });
}

// You can add more helpers here, e.g., fetchSession, checkSession, etc.
