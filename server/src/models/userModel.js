// userModel.js
import { getDB } from "#config/mongoDBConfig.js";
import { ObjectId } from "mongodb";

/* =============================================================================
 * USER ROLE CONSTANTS
 * ========================================================================== */

export const USER_ROLES = Object.freeze({
  CUSTOMER: "customer",
  EMPLOYEE: "employee",
  ADMIN: "admin",
});

const ALLOWED_ROLES = new Set(Object.values(USER_ROLES));

/* =============================================================================
 * DATABASE COLLECTION
 * ========================================================================== */

const getUsersCollection = () => getDB().collection("users");

/* =============================================================================
 * PROJECTIONS (Optional Safe Views)
 * ---------------------------------------------------------------------------
 * - These can be passed into any get* method as { projection }.
 * - Defaults remain unchanged (full doc returned if no projection provided).
 * - Use PUBLIC_PROFILE for dashboards or customer-facing endpoints.
 * - Use AUTH_MINIMAL for login/auth services.
 * ========================================================================== */

export const PROJECTIONS = Object.freeze({
  PUBLIC_PROFILE: {
    _id: 1,
    firstName: 1,
    lastName: 1,
    email: 1,
    role: 1,
    createdAt: 1,
  },
  AUTH: {
    _id: 1,
    email: 1,
    passwordHash: 1,
    role: 1,
  },
});

/* =============================================================================
 * HELPER FUNCTIONS (Internal Use Only)
 * ========================================================================== */

// Converts a string ID to MongoDB ObjectId, throws error if invalid
function toObjectId(id, fieldName = "id") {
  const value = String(id ?? "");
  if (!/^[a-fA-F0-9]{24}$/.test(value)) {
    throw new Error(`Invalid ObjectId for ${fieldName}: "${id}"`);
  }
  return new ObjectId(value);
}

// Validates role is one of: customer, employee, admin
function validateRole(role) {
  if (!ALLOWED_ROLES.has(role)) {
    throw new Error(
      `Invalid role "${role}". Must be one of: ${[...ALLOWED_ROLES].join(", ")}`
    );
  }
}

/* =============================================================================
 * CREATE OPERATIONS
 * ========================================================================== */

/**
 * Creates a new user account.
 * Automatically adds creation timestamp if not provided.
 *
 * Usage: const result = await insertUser({ email: "user@example.com", passwordHash: "...", role: "customer" });
 * Returns: MongoDB InsertOneResult with { insertedId, acknowledged }
 */
export async function insertUser(doc) {
  const user = {
    ...doc,
    createdAt: doc.createdAt || new Date(),
  };

  // Validate role if provided
  if (user.role) {
    validateRole(user.role);
  }

  return getUsersCollection().insertOne(user);
}

/* =============================================================================
 * READ OPERATIONS - Get Single User
 * ========================================================================== */

/**
 * Fetches a user by their email address.
 *
 * Usage: const user = await getUserByEmail("john@example.com", { projection: PROJECTIONS.PUBLIC_PROFILE });
 * Returns: User object or null if not found
 */
export async function getUserByEmail(email, { projection } = {}) {
  return getUsersCollection().findOne({ email }, { projection });
}

/**
 * Fetches a user by their ID.
 *
 * Usage: const user = await getUserById("507f1f77bcf86cd799439011", { projection: PROJECTIONS.PUBLIC_PROFILE });
 * Returns: User object or null if not found
 */
export async function getUserById(id, { projection } = {}) {
  return getUsersCollection().findOne(
    { _id: toObjectId(id, "id") },
    { projection }
  );
}

/**
 * Fetches a user by their ID and role (for authorization checks).
 *
 * Usage: const employee = await getUserByIdAndRole("507f...", "employee", { projection: PROJECTIONS.PUBLIC_PROFILE });
 * Returns: User object or null if not found or role doesn't match
 */
export async function getUserByIdAndRole(id, role, { projection } = {}) {
  validateRole(role);
  return getUsersCollection().findOne(
    { _id: toObjectId(id, "id"), role },
    { projection }
  );
}

/* =============================================================================
 * READ OPERATIONS - List Users
 * ========================================================================== */

/**
 * Gets all users with a specific role.
 *
 * Usage: const employees = await getUsersByRole("employee", { limit: 50, projection: PROJECTIONS.PUBLIC_PROFILE });
 * Returns: Array of user objects
 */
export async function getUsersByRole(role, { limit = 100, projection } = {}) {
  validateRole(role);
  const safeLimit = Math.max(1, Math.min(limit, 500));

  return getUsersCollection()
    .find({ role }, { projection })
    .limit(safeLimit)
    .toArray();
}

/**
 * Gets all users (admin function - use with caution).
 *
 * Usage: const allUsers = await getAllUsers({ limit: 100, projection: PROJECTIONS.PUBLIC_PROFILE });
 * Returns: Array of user objects
 */
export async function getAllUsers({ limit = 100, projection } = {}) {
  const safeLimit = Math.max(1, Math.min(limit, 500));

  return getUsersCollection()
    .find({}, { projection })
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .toArray();
}

/* =============================================================================
 * READ OPERATIONS - Count Users
 * ========================================================================== */

/**
 * Counts total users in the system.
 *
 * Usage: const totalUsers = await countAllUsers();
 * Returns: Number (e.g., 150)
 */
export async function countAllUsers() {
  return getUsersCollection().countDocuments();
}

/**
 * Counts users by role.
 *
 * Usage: const employeeCount = await countUsersByRole("employee");
 * Returns: Number (e.g., 25)
 */
export async function countUsersByRole(role) {
  validateRole(role);
  return getUsersCollection().countDocuments({ role });
}

/* =============================================================================
 * UPDATE OPERATIONS
 * ========================================================================== */

/**
 * Updates a user's password hash.
 *
 * Usage: const updated = await updateUserPassword("507f...", "newHashedPassword");
 * Returns: Updated user object or null if not found
 */
export async function updateUserPassword(id, passwordHash) {
  const result = await getUsersCollection().findOneAndUpdate(
    { _id: toObjectId(id, "id") },
    { $set: { passwordHash, updatedAt: new Date() } },
    { returnDocument: "after" }
  );

  return result.value;
}

/**
 * Updates a user's role (admin function).
 *
 * Usage: const updated = await updateUserRole("507f...", "employee");
 * Returns: Updated user object or null if not found
 */
export async function updateUserRole(id, role) {
  validateRole(role);

  const result = await getUsersCollection().findOneAndUpdate(
    { _id: toObjectId(id, "id") },
    { $set: { role, updatedAt: new Date() } },
    { returnDocument: "after" }
  );

  return result.value;
}

/**
 * Updates a user's email address.
 *
 * Usage: const updated = await updateUserEmail("507f...", "newemail@example.com");
 * Returns: Updated user object or null if not found
 */
export async function updateUserEmail(id, email) {
  const result = await getUsersCollection().findOneAndUpdate(
    { _id: toObjectId(id, "id") },
    { $set: { email, updatedAt: new Date() } },
    { returnDocument: "after" }
  );

  return result.value;
}

/* =============================================================================
 * DELETE OPERATIONS
 * ========================================================================== */

/**
 * Deletes a user by ID (use with caution - consider soft delete instead).
 *
 * Usage: const result = await deleteUserById("507f...");
 * Returns: MongoDB DeleteResult with { deletedCount, acknowledged }
 */
export async function deleteUserById(id) {
  return getUsersCollection().deleteOne({ _id: toObjectId(id, "id") });
}

/* =============================================================================
 * UTILITY OPERATIONS
 * ========================================================================== */

/**
 * Checks if a user with the given email already exists.
 *
 * Usage: const exists = await userExistsByEmail("john@example.com");
 * Returns: Boolean (true if exists, false otherwise)
 */
export async function userExistsByEmail(email) {
  const count = await getUsersCollection().countDocuments(
    { email },
    { limit: 1 }
  );
  return count > 0;
}

/**
 * Checks if a user with the given ID exists.
 *
 * Usage: const exists = await userExistsById("507f...");
 * Returns: Boolean (true if exists, false otherwise)
 */
export async function userExistsById(id) {
  const count = await getUsersCollection().countDocuments(
    { _id: toObjectId(id, "id") },
    { limit: 1 }
  );
  return count > 0;
}

/* =============================================================================
 * USER DOCUMENT SCHEMA (Reference)
 * ========================================================================== */
/**
 * {
 *   _id: ObjectId,
 *   firstName: String,
 *   lastName: String,
 *   saIdNumber: String,       // sensitive
 *   email: String (unique),
 *   passwordHash: String,     // sensitive
 *   role: "customer" | "employee" | "admin",
 *   createdAt: Date,
 *   updatedAt?: Date
 * }
 */
