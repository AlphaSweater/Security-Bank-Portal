import argon2 from "argon2";
import * as userRepo from "#models/userModel.js";
import { getLogger } from "#utils/logger.js";

const logger = getLogger(import.meta.url);

/* =============================================================================
 * AUTH SERVICE
 * ========================================================================== */

/**
 * Registers a new user after validating input and ensuring email uniqueness.
 * Passwords are securely hashed using Argon2id.
 *
 * Returns the created user's PUBLIC_PROFILE (no sensitive fields).
 */
export async function registerNewUser({
  firstName,
  lastName,
  saIdNumber,
  email,
  password,
}) {
  if (!firstName || !lastName || !saIdNumber || !email || !password) {
    throw new Error("All fields are required");
  }

  // Uniqueness check (no projection needed)
  const existingUser = await userRepo.getUserByEmail(email);
  if (existingUser) {
    throw new Error("Email already registered");
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  const newUser = {
    firstName,
    lastName,
    saIdNumber,
    email,
    passwordHash,
    role: userRepo.USER_ROLES.CUSTOMER, // default role
    createdAt: new Date(),
  };

  const created = await userRepo.insertUser(newUser);

  // insertUser now returns the created user directly with id field
  return created; // { id, firstName, lastName, email, role }
}

/**
 * Verifies user credentials by email and password.
 * Uses AUTH projection to fetch only what's needed for auth.
 *
 * Returns PUBLIC_PROFILE for session consumption.
 */
export async function authenticateUser({ email, password }) {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  logger.debug("Attempting to authenticate user");

  const authDoc = await userRepo.getUserByEmail(email, {
    projection: userRepo.PROJECTIONS.AUTH,
  });

  // Avoid user enumeration in messages
  if (!authDoc) {
    logger.debug("User not found");
    throw new Error("Invalid email or password");
  }

  const ok = await argon2.verify(authDoc.passwordHash, password);
  if (!ok) {
    logger.debug("Invalid password");
    throw new Error("Invalid email or password");
  }

  // Fetch a safe profile for downstream consumers (no passwordHash)
  const user = await userRepo.getUserById(authDoc.id, {
    projection: userRepo.PROJECTIONS.PUBLIC_PROFILE,
  });

  logger.debug("User authenticated successfully");
  return user; // { id, firstName, lastName, email, role }
}

/* =============================================================================
 * PROFILE HELPERS
 * Centralized convenience helpers for session/profile use-cases
 * ========================================================================== */

/**
 * Returns basic user info for session and display.
 */
export async function getBasicUserInfo(userId) {
  if (!userId) return null;

  try {
    const user = await userRepo.getUserById(userId, {
      projection: userRepo.PROJECTIONS.PUBLIC_PROFILE,
    });
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  } catch (error) {
    logger.error("Failed to get basic user info", {
      error: error.message,
      userId,
    });
    throw error;
  }
}

/**
 * Returns a fuller profile (still safe) for account pages.
 * PUBLIC_PROFILE + createdAt.
 */
export async function getUserProfile(userId) {
  if (!userId) return null;

  try {
    const profile = await userRepo.getUserById(userId, {
      projection: { ...userRepo.PROJECTIONS.PUBLIC_PROFILE, createdAt: 1 },
    });
    if (!profile) return null;

    return {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      firstName: profile.firstName,
      lastName: profile.lastName,
      createdAt: profile.createdAt,
    };
  } catch (error) {
    logger.error("Failed to get user profile", {
      error: error.message,
      userId,
    });
    throw error;
  }
}

/**
 * Lightweight existence check for authorization.
 */
export async function isActiveUser(userId) {
  if (!userId) return false;

  try {
    return await userRepo.userExistsById(userId);
  } catch (error) {
    logger.error("Failed to check if user is active", {
      error: error.message,
      userId,
    });
    return false;
  }
}

/**
 * Updates user profile (firstName, lastName).
 * Uses a small repo helper to keep all DB writes in the model layer.
 */
export async function updateUserProfile(userId, updates) {
  if (!userId) throw new Error("User ID is required");

  // Whitelist fields
  const allowedFields = ["firstName", "lastName"];
  const sanitized = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) sanitized[field] = updates[field];
  }
  if (Object.keys(sanitized).length === 0) {
    throw new Error("No valid fields to update");
  }

  try {
    logger.info("Updating user profile", {
      userId,
      fields: Object.keys(sanitized),
    });

    // This helper is tiny and keeps writes in the repo layer.
    const updated = await userRepo.updateUserProfileFields(userId, sanitized, {
      returnProjection: userRepo.PROJECTIONS.PUBLIC_PROFILE,
    });

    if (!updated) throw new Error("User not found");

    logger.info("User profile updated successfully", { userId });

    return {
      id: updated.id,
      email: updated.email,
      role: updated.role,
      firstName: updated.firstName,
      lastName: updated.lastName,
    };
  } catch (error) {
    logger.error("Failed to update user profile", {
      error: error.message,
      userId,
    });
    throw error;
  }
}
