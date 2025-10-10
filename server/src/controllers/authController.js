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
  res.set({ "Cache-Control": "no-store" });
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
  res.set({ "Cache-Control": "no-store" });
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
  res.set({ "Cache-Control": "no-store" });
  try {
    await destroySession(req, res);
    return res.json({ message: "Logged out" });
  } catch (err) {
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
      return res.status(401).json({ authenticated: false });
    }

    // 2) Check active user by id from session (with a 3s safety timeout)
    let timeoutHit = false;
    const active = await withTimeout(isActiveUser(session.userId), 3000, () => {
      timeoutHit = true;
    });
    if (timeoutHit) {
      // Timeout-specific response
      return res.status(503).json({
        authenticated: false,
        message: "Session check timed out. Please try again.",
      });
    }
    if (!active) {
      try {
        await destroySession(req, res);
      } catch (destroyErr) {
        logger.warnAsync(
          `destroySession failed for ${session.userId}: ${destroyErr.message}`
        );
      }
      return res.status(401).json({ authenticated: false });
    }

    // 3) OK
    return res.status(200).json({ authenticated: true, role: session.role });
  } catch (err) {
    // Safer for the gate: fail closed on unexpected errors
    logger.warnAsync(`Session check failed: ${err.message}`);
    return res.status(401).json({ authenticated: false });
  }
}

// ---- Helpers ----

// Small utility to bound latency on external checks
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
