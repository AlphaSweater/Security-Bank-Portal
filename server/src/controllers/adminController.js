import { getLogger } from "#utils/logger.js";
import * as adminService from "#services/adminService.js";

const logger = getLogger(import.meta.url);

/* =============================================================================
 * ADMIN CONTROLLER - Employee Account Management
 * Handles admin-only operations for managing employee accounts
 * For transaction reviews: Use employeeController (admins use same functions as employees)
 * ========================================================================== */

// POST /api/admin/employees - Create new employee account
export async function createEmployeeAccount(req, res) {
  res.set({ "Cache-Control": "no-store" });
  const adminId = req.session?.userId;
  // req.body validated by middleware

  const { email, password, firstName, lastName, role } = req.body;

  try {
    const employee = await adminService.createEmployeeAccount(
      { email, password, firstName, lastName, role },
      adminId
    );

    logger.info("Employee account created by admin", {
      employeeId: employee.id,
      role: employee.role,
      adminId,
    });

    return res.status(201).json({
      message: "Employee account created successfully",
      employee,
    });
  } catch (err) {
    logger.error("Failed to create employee account", {
      error: err.message,
      adminId,
    });

    if (err.message.includes("Email already")) {
      return res.status(409).json({ message: err.message });
    }
    if (err.message.includes("Invalid role")) {
      return res.status(400).json({ message: err.message });
    }

    return res
      .status(500)
      .json({ message: "Failed to create employee account" });
  }
}

// GET /api/admin/employees - Get all employees
export async function getAllEmployees(req, res) {
  res.set({ "Cache-Control": "no-store" });

  const options = {
    role: req.query.role, // Optional: filter by 'employee' or 'admin'
    limit: parseInt(req.query.limit) || 50,
  };

  try {
    const employees = await adminService.getAllEmployees(options);

    logger.debug("Retrieved employees list", {
      count: employees.length,
      filterRole: options.role || "all",
    });

    return res.json({
      employees,
      count: employees.length,
    });
  } catch (err) {
    logger.error("Failed to fetch employees", { error: err.message });
    return res.status(500).json({ message: "Failed to fetch employees" });
  }
}

// GET /api/admin/employees/:id - Get employee details
export async function getEmployeeDetails(req, res) {
  res.set({ "Cache-Control": "no-store" });
  const { id } = req.params;

  try {
    const employee = await adminService.getEmployeeDetails(id);

    if (!employee) {
      logger.warn("Employee not found", { employeeId: id });
      return res.status(404).json({ message: "Employee not found" });
    }

    logger.debug("Retrieved employee details", { employeeId: id });
    return res.json({ employee });
  } catch (err) {
    logger.error("Failed to fetch employee details", {
      error: err.message,
      employeeId: id,
    });

    if (err.message.includes("Not an employee")) {
      return res.status(400).json({ message: err.message });
    }

    return res
      .status(500)
      .json({ message: "Failed to fetch employee details" });
  }
}

// PATCH /api/admin/employees/:id - Update employee account
export async function updateEmployeeAccount(req, res) {
  res.set({ "Cache-Control": "no-store" });
  const adminId = req.session?.userId;
  const { id } = req.params;
  const updates = req.body; // Validated by middleware

  try {
    const employee = await adminService.updateEmployeeAccount(
      id,
      updates,
      adminId
    );

    logger.info("Employee account updated by admin", {
      employeeId: id,
      fields: Object.keys(updates),
      adminId,
    });

    return res.json({
      message: "Employee account updated successfully",
      employee,
    });
  } catch (err) {
    logger.error("Failed to update employee account", {
      error: err.message,
      employeeId: id,
      adminId,
    });

    if (err.message.includes("not found")) {
      return res.status(404).json({ message: err.message });
    }
    if (err.message.includes("Invalid role")) {
      return res.status(400).json({ message: err.message });
    }
    if (err.message.includes("Can only update")) {
      return res.status(400).json({ message: err.message });
    }

    return res
      .status(500)
      .json({ message: "Failed to update employee account" });
  }
}

// DELETE /api/admin/employees/:id - Deactivate employee account
export async function deactivateEmployeeAccount(req, res) {
  res.set({ "Cache-Control": "no-store" });
  const adminId = req.session?.userId;
  const { id } = req.params;

  try {
    const result = await adminService.deactivateEmployeeAccount(id, adminId);

    logger.info("Employee account deactivated by admin", {
      employeeId: id,
      adminId,
    });

    return res.json(result);
  } catch (err) {
    logger.error("Failed to deactivate employee account", {
      error: err.message,
      employeeId: id,
      adminId,
    });

    if (err.message.includes("not found")) {
      return res.status(404).json({ message: err.message });
    }
    if (err.message.includes("Cannot deactivate your own")) {
      return res.status(400).json({ message: err.message });
    }
    if (err.message.includes("Can only deactivate")) {
      return res.status(400).json({ message: err.message });
    }

    return res
      .status(500)
      .json({ message: "Failed to deactivate employee account" });
  }
}

// GET /api/admin/employees/search - Search employees
export async function searchEmployees(req, res) {
  res.set({ "Cache-Control": "no-store" });
  const { q } = req.query;

  if (!q || q.trim().length === 0) {
    return res.status(400).json({ message: "Search term is required" });
  }

  try {
    const employees = await adminService.searchEmployees(q);

    logger.debug("Employee search completed", {
      searchTerm: q,
      resultCount: employees.length,
    });

    return res.json({
      employees,
      count: employees.length,
      searchTerm: q,
    });
  } catch (err) {
    logger.error("Failed to search employees", {
      error: err.message,
      searchTerm: q,
    });
    return res.status(500).json({ message: "Failed to search employees" });
  }
}

// GET /api/admin/stats/employees - Get employee account statistics
export async function getEmployeeAccountStats(req, res) {
  res.set({ "Cache-Control": "no-store" });

  try {
    const stats = await adminService.getEmployeeAccountStats();

    logger.debug("Retrieved employee account stats", stats);
    return res.json({ stats });
  } catch (err) {
    logger.error("Failed to fetch employee stats", { error: err.message });
    return res.status(500).json({ message: "Failed to fetch statistics" });
  }
}
