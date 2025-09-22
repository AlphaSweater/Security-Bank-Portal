import argon2 from "argon2";
import { insertUser, findUserByEmail } from "#/models/User.js";
import { getLogger } from "#utils/logger.js";
const logger = getLogger(import.meta.url);

/**
 * Registers a new user in the database.
 * - Checks for required fields (firstName, lastName, saIdNumber, email, password)
 * - Ensures email is not already registered.
 * - Hashes the password securely with Argon2id.
 * - Inserts the user document with all required fields.
 * @param {{ firstName: string, lastName: string, saIdNumber: string, email: string, password: string}} param0
 * @returns {Promise<import('mongodb').ObjectId>} The inserted user's ObjectId
 * @throws {Error} If validation fails or email is taken
 */
export async function registerNewUser({
  firstName,
  lastName,
  saIdNumber,
  email,
  password,
}) {
  if (!firstName || !lastName || !saIdNumber || !email || !password)
    throw new Error("All fields are required");

  const existing = await findUserByEmail(email);
  if (existing) throw new Error("Email already registered");

  // Hash the password using Argon2id
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  // Insert the new user document
  const result = await insertUser({
    firstName,
    lastName,
    saIdNumber,
    email,
    passwordHash,
    role: "user", // default role for registration
    createdAt: new Date(),
  });

  return result.insertedId;
}

/**
 * Validate user credentials. Returns user if valid, throws if not.
 * @param {{ email: string, password: string }} param0
 * @returns {Promise<Object>} user
 */

/**
 * Validate user credentials. Returns user if valid, throws if not.
 * @param {{ email: string, password: string }} param0
 * @returns {Promise<Object>} user
 */
export async function validateUser({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user) {
    logger.debug("User not found");
    throw new Error("Invalid credentials");
  }

  logger.debug("User found:", user.email);
  logger.debug("Verifying password");

  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) {
    logger.debug("Invalid password");
    throw new Error("Invalid credentials");
  }

  return user;
}
