import * as userRepo from "#models/userModel.js";

/**
 * Returns basic user info for session validation and frontend use.
 * @param {string} userId
 * @returns {Promise<{ id, email, role, firstName, lastName }|null>}
 */
export async function getBasicUserInfo(userId) {
  if (!userId) return null;
  const user = await userRepo.getUserById(userId);
  if (!user) return null;
  return {
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

/**
 * Checks if a user exists and is active
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export async function isActiveUser(userId) {
  if (!userId) return false;
  const user = await userRepo.getUserById(userId);
  return !!user;
}
