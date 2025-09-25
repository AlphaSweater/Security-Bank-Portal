import argon2 from "argon2";
import { insertUser, findUserByEmail } from "#models/User.js";
import { getLogger } from "#utils/logger.js";
const logger = getLogger(import.meta.url);

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

export async function verifyUser({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user) {
    logger.debug("User not found");
    throw new Error("Invalid email or password");
  }

  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) {
    logger.debug("Invalid password");
    throw new Error("Invalid email or password");
  }

  return user;
}
