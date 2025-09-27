import { createSession, destroySession } from "#services/sessionService.js";
import * as authService from "#services/authService.js";
import { isActiveUser } from "#services/userService.js";
import { getLogger } from "#utils/logger.js";

const logger = getLogger(import.meta.url);

// --- Auth Controller ---

// POST /auth/login
export async function login(req, res, next) {
  // All fields are already validated and stripped by middleware
  const { email, password } = req.body;
  try {
    const user = await authService.authenticateUser({ email, password });
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
    await authService.registerNewUser({
      firstName,
      lastName,
      saIdNumber,
      email,
      password,
    });
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
  logger.debugAsync("Session check requested");

  // Check if session exists and has a valid userId
  if (!req.session || !req.session.userId) {
    logger.debugAsync("No valid session or userId");
    return res.status(401).json({ authenticated: false });
  }

  // Validate user exists and is active
  const isActive = await isActiveUser(req.session.userId);
  if (!isActive) {
    await destroySession(req, res);
    logger.debugAsync(`Session invalidated for userId ${req.session.userId}`);
    return res.status(401).json({ authenticated: false });
  }

  // Session is valid, return success
  logger.debugAsync(`Session verified!`);
  return res.json({ authenticated: true });
}
