import { createSession, destroySession } from "#services/sessionService.js";
import { registerNewUser, verifyUser } from "#services/authService.js";
import { getLogger } from "#utils/logger.js";
const logger = getLogger(import.meta.url);

// Auth controller

// Register controller action
// POST /auth/register
export async function register(req, res, next) {
  try {
    // All fields are already validated and stripped by middleware

    // Destructure the validated fields
    const { firstName, lastName, saIdNumber, email, password } = req.body;

    try {
      const userId = await registerNewUser({
        firstName,
        lastName,
        saIdNumber,
        email,
        password,
      });

      // Registration successful response
      res.status(201).json({ message: "Registration successful" });
    } catch (registrationError) {
      // Duplicate email or other registration error response
      res
        .status(400)
        .json({ message: registrationError.message || "Registration failed" });
    }
  } catch (unexpectedError) {
    next(unexpectedError);
  }
}

// Login controller action
// POST /auth/login
export async function login(req, res, next) {
  try {
    // All fields are already validated and stripped by middleware

    // Destructure the validated fields
    const { email, password } = req.body;

    // Call the validation service method
    try {
      const user = await verifyUser({ email, password });

      // Create a session for the user
      const sessionId = await createSession(req, user);
      res.json({
        message: "Logged in",
        userId: user._id,
        roles: user.role ? [user.role] : [],
        name: user.firstName ? user.firstName : user.email,
        sessionCookie: sessionId,
      });
    } catch (loginError) {
      // Invalid credentials or session error
      res
        .status(401)
        .json({ message: loginError.message || "Invalid credentials" });
    }
  } catch (unexpectedError) {
    next(unexpectedError);
  }
}

// Logout controller action
// POST /auth/logout
export async function logout(req, res) {
  try {
    // Destroy the user's session
    await destroySession(req, res);
    res.json({ message: "Logged out" });
  } catch (logoutError) {
    res.status(500).json({ message: "Logout failed" });
  }
}
