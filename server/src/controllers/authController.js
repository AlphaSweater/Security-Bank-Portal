import {
  createSession,
  destroySession,
  fetchSession,
} from "#services/sessionService.js";
import * as authService from "#services/authService.js";

import { isActiveUser, getBasicUserInfo } from "#services/userService.js";
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
  try {
    // Fetch session first (we can't validate active user without userId)
    const session = await fetchSession(req);
    if (!session || !session.userId) {
      logger.debugAsync("No valid session or userId in session store");
      return res.status(401).json({ authenticated: false });
    }

    // Start active user check immediately after we have userId
    const activePromise = isActiveUser(session.userId);

    // Await the active check (extendable: Promise.all if we add more parallel tasks later)
    const active = await activePromise;

    if (!active) {
      // Invalidate session fully now – user is no longer active
      try {
        await destroySession(req, res);
      } catch (destroyErr) {
        logger.warnAsync(
          `Failed destroying session for inactive user ${session.userId}: ${destroyErr.message}`
        );
      }
      logger.debugAsync(
        `Rejected session for inactive userId ${session.userId}`
      );
      return res.status(401).json({ authenticated: false });
    }

    // All good – authenticated & active
    return res.json({ authenticated: true, role: session.role });
  } catch (err) {
    logger.warnAsync(`Session check failed: ${err.message}`);
    return res
      .status(500)
      .json({ authenticated: false, message: "Session check failed" });
  }
}
