import express from "express";
import * as adminController from "#controllers/adminController.js";
import requireAuth from "#middlewares/authMiddleware.js";
import { requireRole } from "#middlewares/roleMiddleware.js";
import { asyncHandler } from "#utils/asyncHandler.js";
import { addRateLimiter } from "#middlewares/rateLimitMiddleware.js";
import { GeneralLimiter } from "#config/rateLimitConfig.js";
import { validateData } from "#middlewares/validationMiddleware.js";
import * as userValidation from "#utils/validation/userValidation.js";

const router = express.Router();

/* =============================================================================
 * ADMIN ROUTES - Employee Account Management
 * All routes require 'admin' role
 * For transaction reviews, admins use /api/employees routes
 * ========================================================================== */

// POST /api/admin/employees - Create employee account
router.post(
  "/employees",
  addRateLimiter(GeneralLimiter),
  requireAuth,
  requireRole("admin"),
  validateData(userValidation.createEmployeeSchema),
  asyncHandler(adminController.createEmployeeAccount)
);

// GET /api/admin/employees - Get all employees
router.get(
  "/employees",
  addRateLimiter(GeneralLimiter),
  requireAuth,
  requireRole("admin"),
  asyncHandler(adminController.getAllEmployees)
);

// GET /api/admin/employees/search - Search employees
router.get(
  "/employees/search",
  addRateLimiter(GeneralLimiter),
  requireAuth,
  requireRole("admin"),
  asyncHandler(adminController.searchEmployees)
);

// GET /api/admin/employees/:id - Get employee details
router.get(
  "/employees/:id",
  addRateLimiter(GeneralLimiter),
  requireAuth,
  requireRole("admin"),
  asyncHandler(adminController.getEmployeeDetails)
);

// PATCH /api/admin/employees/:id - Update employee account
router.patch(
  "/employees/:id",
  addRateLimiter(GeneralLimiter),
  requireAuth,
  requireRole("admin"),
  validateData(userValidation.updateEmployeeSchema),
  asyncHandler(adminController.updateEmployeeAccount)
);

// DELETE /api/admin/employees/:id - Deactivate employee account
router.delete(
  "/employees/:id",
  addRateLimiter(GeneralLimiter),
  requireAuth,
  requireRole("admin"),
  asyncHandler(adminController.deactivateEmployeeAccount)
);

// GET /api/admin/stats/employees - Get employee account statistics
router.get(
  "/stats/employees",
  addRateLimiter(GeneralLimiter),
  requireAuth,
  requireRole("admin"),
  asyncHandler(adminController.getEmployeeAccountStats)
);

export default router;
