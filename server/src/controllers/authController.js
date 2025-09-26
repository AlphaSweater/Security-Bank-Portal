import { createSession, destroySession } from "#services/sessionService.js";
import { registerNewUser, authenticateUser } from "#services/authService.js";
import { getLogger } from "#utils/logger.js";

const logger = getLogger(import.meta.url);

// --- Auth Controller ---

// POST /auth/login
export async function login(req, res, next) {
  // All fields are already validated and stripped by middleware
  const { email, password } = req.body;
  try {
    const user = await authenticateUser({ email, password });
    await createSession(req, user);
    return res.json({ message: "Log in successful" });
  } catch (err) {
    // Invalid credentials or session error
    return res
      .status(401)
      .json({ message: err.message || "Invalid credentials" });
  }
}

// POST /auth/register
export async function register(req, res, next) {
  // All fields are already validated and stripped by middleware
  const { firstName, lastName, saIdNumber, email, password } = req.body;
  try {
    await registerNewUser({ firstName, lastName, saIdNumber, email, password });
    return res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    // Duplicate email or other registration error response
    return res
      .status(400)
      .json({ message: err.message || "Registration failed" });
  }
}

// POST /auth/logout
export async function logout(req, res) {
  try {
    await destroySession(req, res);
    return res.json({ message: "Logged out" });
  } catch (err) {
    return res.status(500).json({ message: "Logout failed" });
  }
}

// GET /auth/session
export async function sessionCheck(req, res) {
  logger.debug("Session check requested");
  // Check if the session and userId exist
  if (!req.session || !req.session.userId) {
    logger.debug("No valid session");
    return res.status(401).json({ authenticated: false });
  }
  logger.debug("Session verified!");
  return res.json({ authenticated: true });
}
