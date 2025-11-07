import argon2 from "argon2";
import * as userRepo from "#models/userModel.js";
import { getLogger } from "#utils/logger.js";

const logger = getLogger(import.meta.url);

/**
 * Registers a new user after validating input and ensuring email uniqueness.
 * Passwords are securely hashed using Argon2id.
 */
export async function registerNewUser({
  firstName,
  lastName,
  saIdNumber,
  email,
  password,
}) {
  // Validate required fields
  if (!firstName || !lastName || !saIdNumber || !email || !password) {
    throw new Error("All fields are required");
  }

  // Check if email is already registered
  const existingUser = await userRepo.getUserByEmail(email);
  if (existingUser) {
    throw new Error("Email already registered");
  }

  // Hash the password securely
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  // Create user object
  const newUser = {
    firstName,
    lastName,
    saIdNumber,
    email,
    passwordHash,
    role: "customer", // default role
    createdAt: new Date(),
  };

  // Insert user into database
  const result = await userRepo.insertUser(newUser);
  return result.insertedId;
}

/**
 * Verifies user credentials by email and password.
 */
export async function authenticateUser({ email, password }) {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  logger.debug(`Attempting to authenticate user`);

  const user = await userRepo.getUserByEmail(email);
  if (!user) {
    logger.debug("User not found");
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await argon2.verify(user.passwordHash, password);
  if (!isPasswordValid) {
    logger.debug("Invalid password");
    throw new Error("Invalid email or password");
  }

  logger.debug(`User authenticated successfully!`);
  return user;
}

/* ---------------------------------------------------------------------------
 * User helper functions (moved from userService)
 * These provide small profile lookups and profile updates used by session
 * management and other services. Kept here to centralize authentication- and
 * profile-related helpers.
 * ------------------------------------------------------------------------ */

/**
 * Returns basic user info using the userId.
 * Used for session management and profile display.
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} - Basic user info or null
 */
export async function getBasicUserInfo(userId) {
  if (!userId) return null;

  try {
    const user = await userRepo.getUserById(userId);
    if (!user) return null;

    return {
      id: user._id.toString(),
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
 * Gets full user profile with additional details.
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} - Full user profile or null
 */
export async function getUserProfile(userId) {
  if (!userId) return null;

  try {
    const user = await userRepo.getUserById(userId);
    if (!user) return null;

    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      // Add any other profile fields here
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
 * Checks if a user exists and is active.
 * Used for authorization and validation.
 *
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - True if user exists
 */
export async function isActiveUser(userId) {
  if (!userId) return false;

  try {
    const user = await userRepo.getUserById(userId);
    return !!user;
  } catch (error) {
    logger.error("Failed to check if user is active", {
      error: error.message,
      userId,
    });
    return false;
  }
}

/**
 * Updates user profile information.
 *
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update (firstName, lastName, etc.)
 * @returns {Promise<Object>} - Updated user info
 */
export async function updateUserProfile(userId, updates) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  // Whitelist allowed fields for security
  const allowedFields = ["firstName", "lastName"];
  const sanitizedUpdates = {};

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      sanitizedUpdates[field] = updates[field];
    }
  }

  if (Object.keys(sanitizedUpdates).length === 0) {
    throw new Error("No valid fields to update");
  }

  try {
    logger.info("Updating user profile", {
      userId,
      fields: Object.keys(sanitizedUpdates),
    });

    const updatedUser = await userRepo.updateUser(userId, sanitizedUpdates);

    if (!updatedUser) {
      throw new Error("User not found");
    }

    logger.info("User profile updated successfully", { userId });

    return {
      id: updatedUser._id.toString(),
      email: updatedUser.email,
      role: updatedUser.role,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
    };
  } catch (error) {
    logger.error("Failed to update user profile", {
      error: error.message,
      userId,
    });
    throw error;
  }
}
