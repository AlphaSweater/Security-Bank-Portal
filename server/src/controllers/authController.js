import { getLogger } from "#utils/logger.js";
const logger = getLogger(import.meta.url);

// Login controller with hardcoded user for testing
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Hardcoded user for testing
    const user = {
      id: "testguy-123",
      name: "Test Guy",
      email: "testguy@example.com",
      roles: ["user"],
    };

    if (email !== user.email || password !== "password123") {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // This regenerates the session, creating a new session ID and cookie
    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ message: "Session error" });
      // These values are stored in the session on the server (and in Redis)
      req.session.userId = user.id;
      req.session.roles = user.roles;
      // At this point, the session middleware will set a Set-Cookie header in the HTTP response
      // The browser will store this cookie (named 'sid' by default) and send it with future requests
      res.json({
        message: "Logged in",
        userId: user.id,
        roles: user.roles,
        name: user.name,
        // For learning: show the session ID that will be stored in the cookie
        sessionCookie: req.sessionID,
      });
    });
  } catch (err) {
    next(err);
  }
}

// Logout controller
export function logout(req, res) {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.clearCookie("sid");
    res.json({ message: "Logged out" });
  });
}
