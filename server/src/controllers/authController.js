import {
  createSession,
  destroySession,
  fetchSession,
} from "#services/sessionService.js";
import * as authService from "#services/authService.js";

import { getLogger } from "#utils/logger.js";

const logger = getLogger(import.meta.url);

/* =============================================================================
 * AUTH CONTROLLER - Authentication Operations
 * Handles user authentication, registration, and session management
 * ========================================================================== */

// POST /auth/login
export async function login(req, res) {
  res.set({ "Cache-Control": "no-store" });
  // All fields are already validated and stripped by middleware
  const { email, password } = req.body;
  try {
    const user = await authService.authenticateUser({ email, password });
    await createSession(req, user);

    logger.info("User logged in successfully", {
      userId: user.id,
      role: user.role,
    });

    return res.json({ message: "Log in successful" });
  } catch (err) {
    logger.warn("Login attempt failed", { email, error: err.message });
    // Invalid credentials or session error
    return res
      .status(401)
      .json({ message: err.message || "Invalid credentials" });
  }
}

// POST /auth/register
export async function register(req, res) {
  // All fields are already validated and stripped by middleware
  res.set({ "Cache-Control": "no-store" });
  const { firstName, lastName, saIdNumber, email, password } = req.body;
  try {
    const user = await authService.registerNewUser({
      firstName,
      lastName,
      saIdNumber,
      email,
      password,
    });

    logger.info("New user registered", {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    logger.warn("Registration failed", { email, error: err.message });
    // Duplicate email or other registration error response
    return res
      .status(400)
      .json({ message: err.message || "Registration failed" });
  }
}

// POST /auth/logout
export async function logout(req, res) {
  res.set({ "Cache-Control": "no-store" });
  const userId = req.session?.userId;

  try {
    await destroySession(req, res);

    logger.info("User logged out", { userId });

    return res.json({ message: "Logged out" });
  } catch (err) {
    logger.error("Logout failed", { userId, error: err.message });
    return res.status(500).json({ message: "Logout failed" });
  }
}

// GET /auth/session
export async function sessionCheck(req, res) {
  // Never cache this probe
  res.set({
    "Cache-Control": "no-store",
  });

  try {
    // 1) Fetch session
    const session = await fetchSession(req);
    if (!session || !session.userId) {
      logger.debug("Session check failed: no session");
      return res.status(401).json({ authenticated: false });
    }

    // 2) Check active user by id from session (with a 3s safety timeout)
    let timeoutHit = false;
    const active = await withTimeout(
      authService.isActiveUser(session.userId),
      3000,
      () => {
        timeoutHit = true;
      }
    );
    if (timeoutHit) {
      logger.warn("Session check timed out", { userId: session.userId });
      // Timeout-specific response
      return res.status(503).json({
        authenticated: false,
        message: "Session check timed out. Please try again.",
      });
    }
    if (!active) {
      logger.debug("Session check failed: user inactive", {
        userId: session.userId,
      });
      try {
        await destroySession(req, res);
      } catch (destroyErr) {
        logger.warn("destroySession failed for inactive user", {
          userId: session.userId,
          error: destroyErr.message,
        });
      }
      return res.status(401).json({ authenticated: false });
    }

    // 3) OK
    logger.debug("Session check successful", {
      userId: session.userId,
      role: session.role,
    });
    return res.status(200).json({ authenticated: true, role: session.role });
  } catch (err) {
    // Safer for the gate: fail closed on unexpected errors
    logger.warn("Session check failed with error", { error: err.message });
    return res.status(401).json({ authenticated: false });
  }
}

/* =============================================================================
 * HELPER FUNCTIONS
 * ========================================================================== */

/**
 * Small utility to bound latency on external checks
 */
function withTimeout(promise, ms, onTimeout) {
  let timeoutId;
  const timeoutPromise = new Promise((resolve) => {
    timeoutId = setTimeout(() => {
      if (onTimeout) onTimeout();
      resolve(false);
    }, ms);
  });
  return Promise.race([
    promise.then((result) => {
      clearTimeout(timeoutId);
      return result;
    }),
    timeoutPromise,
  ]);
}
