import { getLogger } from "#utils/logger.js";
import { createSession, destroySession } from "#services/sessionService.js";
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

    // Use sessionService to handle session creation
    try {
      const sessionId = await createSession(req, user);
      res.json({
        message: "Logged in",
        userId: user.id,
        roles: user.roles,
        name: user.name,
        sessionCookie: sessionId,
      });
    } catch (err) {
      return res.status(500).json({ message: "Session error" });
    }
  } catch (err) {
    next(err);
  }
}

// Logout controller
export async function logout(req, res) {
  try {
    await destroySession(req, res);
    res.json({ message: "Logged out" });
  } catch (err) {
    res.status(500).json({ message: "Logout failed" });
  }
}
