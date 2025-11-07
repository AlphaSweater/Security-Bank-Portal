import * as userRepo from "#models/userModel.js";
import { getLogger } from "#utils/logger.js";

const logger = getLogger(import.meta.url);

/* =============================================================================
 * ADMIN SERVICE - Employee Account Management
 *
 * This service is EXCLUSIVELY for admin-only operations:
 * - Creating new employee accounts
 * - Managing employee accounts (update, deactivate)
 * - Viewing all employees
 * - Employee oversight and monitoring
 *
 * For transaction reviews/approvals: Use employeeService.js
 * (Admins use the same transaction functions as employees)
 * ========================================================================== */

const ADMIN_CONFIG = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 200,
  ALLOWED_EMPLOYEE_ROLES: ["employee", "admin"],
};

/* =============================================================================
 * EMPLOYEE ACCOUNT CREATION
 * ========================================================================== */

/**
 * Creates a new employee or admin account.
 * Only admins can perform this operation.
 *
 * @param {Object} employeeData - Employee account data
 * @param {string} employeeData.email - Employee email
 * @param {string} employeeData.password - Employee password (will be hashed)
 * @param {string} employeeData.firstName - First name
 * @param {string} employeeData.lastName - Last name
 * @param {string} employeeData.role - Role ('employee' or 'admin')
 * @param {string} createdByAdminId - Admin ID creating the account
 * @returns {Promise<Object>} - Created employee info
 */
export async function createEmployeeAccount(employeeData, createdByAdminId) {
  const { email, password, firstName, lastName, role } = employeeData;

  // Validate required fields
  if (!email || !password || !firstName || !lastName || !role) {
    throw new Error(
      "All fields are required: email, password, firstName, lastName, role"
    );
  }

  // Validate role
  if (!ADMIN_CONFIG.ALLOWED_EMPLOYEE_ROLES.includes(role)) {
    throw new Error(
      `Invalid role. Must be one of: ${ADMIN_CONFIG.ALLOWED_EMPLOYEE_ROLES.join(
        ", "
      )}`
    );
  }

  // Validate admin exists
  if (!createdByAdminId) {
    throw new Error("Admin ID is required");
  }

  logger.info("Admin creating employee account", {
    email,
    role,
    createdByAdminId,
  });

  try {
    // Check if email already exists
    const existingUser = await userRepo.getUserByEmail(email);
    if (existingUser) {
      throw new Error("Email already in use");
    }

    // Create the employee account (password will be hashed by authService/userRepo)
    const newEmployee = await userRepo.createUser({
      email,
      password,
      firstName,
      lastName,
      role,
      createdBy: createdByAdminId,
      createdAt: Math.floor(Date.now() / 1000),
    });

    logger.info("Employee account created successfully", {
      employeeId: newEmployee._id.toString(),
      email,
      role,
      createdByAdminId,
    });

    return {
      id: newEmployee._id.toString(),
      email: newEmployee.email,
      firstName: newEmployee.firstName,
      lastName: newEmployee.lastName,
      role: newEmployee.role,
      createdAt: newEmployee.createdAt,
    };
  } catch (error) {
    logger.error("Failed to create employee account", {
      error: error.message,
      email,
      createdByAdminId,
    });
    throw error;
  }
}

/* =============================================================================
 * EMPLOYEE ACCOUNT MANAGEMENT
 * ========================================================================== */

/**
 * Updates an employee account.
 * Admins can update employee details and roles.
 *
 * @param {string} employeeId - Employee user ID
 * @param {Object} updates - Fields to update
 * @param {string} updates.firstName - Optional: First name
 * @param {string} updates.lastName - Optional: Last name
 * @param {string} updates.role - Optional: Role ('employee' or 'admin')
 * @param {string} updatedByAdminId - Admin ID performing the update
 * @returns {Promise<Object>} - Updated employee info
 */
export async function updateEmployeeAccount(
  employeeId,
  updates,
  updatedByAdminId
) {
  if (!employeeId) {
    throw new Error("Employee ID is required");
  }

  if (!updatedByAdminId) {
    throw new Error("Admin ID is required");
  }

  // Whitelist allowed fields for employee updates
  const allowedFields = ["firstName", "lastName", "role"];
  const sanitizedUpdates = {};

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      // Validate role if being updated
      if (
        field === "role" &&
        !ADMIN_CONFIG.ALLOWED_EMPLOYEE_ROLES.includes(updates[field])
      ) {
        throw new Error(
          `Invalid role. Must be one of: ${ADMIN_CONFIG.ALLOWED_EMPLOYEE_ROLES.join(
            ", "
          )}`
        );
      }
      sanitizedUpdates[field] = updates[field];
    }
  }

  if (Object.keys(sanitizedUpdates).length === 0) {
    throw new Error("No valid fields to update");
  }

  logger.info("Admin updating employee account", {
    employeeId,
    updates: Object.keys(sanitizedUpdates),
    updatedByAdminId,
  });

  try {
    const employee = await userRepo.getUserById(employeeId);

    if (!employee) {
      throw new Error("Employee not found");
    }

    // Ensure the target user is an employee or admin (not a customer)
    if (!ADMIN_CONFIG.ALLOWED_EMPLOYEE_ROLES.includes(employee.role)) {
      throw new Error("Can only update employee or admin accounts");
    }

    const updatedEmployee = await userRepo.updateUser(
      employeeId,
      sanitizedUpdates
    );

    logger.info("Employee account updated successfully", {
      employeeId,
      updatedByAdminId,
    });

    return {
      id: updatedEmployee._id.toString(),
      email: updatedEmployee.email,
      firstName: updatedEmployee.firstName,
      lastName: updatedEmployee.lastName,
      role: updatedEmployee.role,
      createdAt: updatedEmployee.createdAt,
    };
  } catch (error) {
    logger.error("Failed to update employee account", {
      error: error.message,
      employeeId,
      updatedByAdminId,
    });
    throw error;
  }
}

/**
 * Deactivates/deletes an employee account.
 *
 * @param {string} employeeId - Employee user ID
 * @param {string} deletedByAdminId - Admin ID performing the deletion
 * @returns {Promise<Object>} - Deletion result
 */
export async function deactivateEmployeeAccount(employeeId, deletedByAdminId) {
  if (!employeeId) {
    throw new Error("Employee ID is required");
  }

  if (!deletedByAdminId) {
    throw new Error("Admin ID is required");
  }

  logger.info("Admin deactivating employee account", {
    employeeId,
    deletedByAdminId,
  });

  try {
    const employee = await userRepo.getUserById(employeeId);

    if (!employee) {
      throw new Error("Employee not found");
    }

    // Prevent deleting customer accounts
    if (!ADMIN_CONFIG.ALLOWED_EMPLOYEE_ROLES.includes(employee.role)) {
      throw new Error("Can only deactivate employee or admin accounts");
    }

    // Prevent self-deletion
    if (employeeId === deletedByAdminId) {
      throw new Error("Cannot deactivate your own account");
    }

    await userRepo.deleteUser(employeeId);

    logger.info("Employee account deactivated successfully", {
      employeeId,
      email: employee.email,
      deletedByAdminId,
    });

    return {
      success: true,
      message: "Employee account deactivated",
      employeeId,
      email: employee.email,
    };
  } catch (error) {
    logger.error("Failed to deactivate employee account", {
      error: error.message,
      employeeId,
      deletedByAdminId,
    });
    throw error;
  }
}

/* =============================================================================
 * EMPLOYEE LISTING & SEARCH
 * ========================================================================== */

/**
 * Gets all employees and admins.
 *
 * @param {Object} options - Filter and pagination options
 * @param {string} options.role - Optional: Filter by role ('employee' or 'admin')
 * @param {number} options.limit - Optional: Pagination limit
 * @returns {Promise<Array>} - List of employees
 */
export async function getAllEmployees(options = {}) {
  try {
    const { role, limit } = options;

    const queryLimit = Math.min(
      limit || ADMIN_CONFIG.DEFAULT_PAGE_SIZE,
      ADMIN_CONFIG.MAX_PAGE_SIZE
    );

    // Get all users and filter for employees/admins
    let employees;

    if (role && ADMIN_CONFIG.ALLOWED_EMPLOYEE_ROLES.includes(role)) {
      employees = await userRepo.getUsersByRole?.(role, queryLimit);
    } else {
      // Get both employees and admins
      const [employeeList, adminList] = await Promise.all([
        userRepo.getUsersByRole?.("employee", queryLimit) ||
          Promise.resolve([]),
        userRepo.getUsersByRole?.("admin", queryLimit) || Promise.resolve([]),
      ]);
      employees = [...employeeList, ...adminList];
    }

    // Format response
    const formattedEmployees = (employees || []).map((emp) => ({
      id: emp._id.toString(),
      email: emp.email,
      firstName: emp.firstName,
      lastName: emp.lastName,
      role: emp.role,
      createdAt: emp.createdAt,
    }));

    logger.debug("Retrieved employees list", {
      count: formattedEmployees.length,
      filterRole: role || "all",
    });

    return formattedEmployees;
  } catch (error) {
    logger.error("Failed to get employees list", {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Gets detailed information about a specific employee.
 * Includes account details and activity summary.
 *
 * @param {string} employeeId - Employee user ID
 * @returns {Promise<Object>} - Employee details
 */
export async function getEmployeeDetails(employeeId) {
  if (!employeeId) {
    throw new Error("Employee ID is required");
  }

  try {
    const employee = await userRepo.getUserById(employeeId);

    if (!employee) {
      return null;
    }

    // Ensure it's an employee/admin account
    if (!ADMIN_CONFIG.ALLOWED_EMPLOYEE_ROLES.includes(employee.role)) {
      throw new Error("Not an employee account");
    }

    // Note: Transaction review counts would come from employeeService
    // This service is purely for account management

    logger.debug("Retrieved employee details", { employeeId });

    return {
      id: employee._id.toString(),
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      role: employee.role,
      createdAt: employee.createdAt,
      createdBy: employee.createdBy?.toString(),
    };
  } catch (error) {
    logger.error("Failed to get employee details", {
      error: error.message,
      employeeId,
    });
    throw error;
  }
}

/**
 * Searches for employees by email or name.
 *
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} - Matching employees
 */
export async function searchEmployees(searchTerm) {
  if (!searchTerm || searchTerm.trim().length === 0) {
    throw new Error("Search term is required");
  }

  try {
    // Get all employees and filter client-side
    // (In production, you'd want a proper search index)
    const allEmployees = await getAllEmployees({
      limit: ADMIN_CONFIG.MAX_PAGE_SIZE,
    });

    const lowerSearch = searchTerm.toLowerCase().trim();
    const matches = allEmployees.filter((emp) => {
      return (
        emp.email.toLowerCase().includes(lowerSearch) ||
        emp.firstName.toLowerCase().includes(lowerSearch) ||
        emp.lastName.toLowerCase().includes(lowerSearch) ||
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(lowerSearch)
      );
    });

    logger.debug("Employee search completed", {
      searchTerm,
      matchCount: matches.length,
    });

    return matches;
  } catch (error) {
    logger.error("Failed to search employees", {
      error: error.message,
      searchTerm,
    });
    throw error;
  }
}

/* =============================================================================
 * EMPLOYEE STATISTICS (Account Management Context)
 * ========================================================================== */

/**
 * Gets employee account statistics.
 *
 * @returns {Promise<Object>} - Employee account stats
 */
export async function getEmployeeAccountStats() {
  try {
    const [employees, admins] = await Promise.all([
      userRepo.getUsersByRole?.("employee", 10000) || Promise.resolve([]),
      userRepo.getUsersByRole?.("admin", 10000) || Promise.resolve([]),
    ]);

    const stats = {
      totalEmployees: (employees?.length || 0) + (admins?.length || 0),
      byRole: {
        employee: employees?.length || 0,
        admin: admins?.length || 0,
      },
    };

    logger.debug("Retrieved employee account stats", stats);

    return stats;
  } catch (error) {
    logger.error("Failed to get employee account stats", {
      error: error.message,
    });
    throw error;
  }
}
