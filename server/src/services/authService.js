import argon2 from "argon2";
import { insertUser, findUserByEmail } from "#models/userModel.js";
import { getLogger } from "#utils/logger.js";

const logger = getLogger(import.meta.url);

/**
 * Registers a new user after validating input and ensuring email uniqueness.
 * Passwords are securely hashed using Argon2id.
 * @param {Object} userData - User registration data
 * @returns {Promise<string>} Inserted user ID
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
  const existingUser = await findUserByEmail(email);
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
    role: "user", // default role
    createdAt: new Date(),
  };

  // Insert user into database
  const result = await insertUser(newUser);
  return result.insertedId;
}

/**
 * Verifies user credentials by email and password.
 * @param {Object} credentials - User login data
 * @returns {Promise<Object>} User object if valid
 */
export async function verifyUser({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user) {
    logger.debug("User not found");
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await argon2.verify(user.passwordHash, password);
  if (!isPasswordValid) {
    logger.debug("Invalid password");
    throw new Error("Invalid email or password");
  }

  return user;
}
