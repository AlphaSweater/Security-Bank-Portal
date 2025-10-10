import express from "express";
import { validateData } from "#middlewares/validationMiddleware.js";
import { asyncHandler } from "#utils/asyncHandler.js";
import { addRateLimiter } from "#middlewares/rateLimitMiddleware.js";
import {
  AuthFlowLimiter,
  LoginLimiter,
  EmailTargetLimiter,
  ExcessLimiter,
} from "#config/rateLimitConfig.js";

import * as authController from "#controllers/authController.js";
import * as userValidation from "#utils/validation/userValidation.js";

const router = express.Router();

// GET endpoints to check authentication status
router.get(
  "/sessionCheck",
  addRateLimiter(ExcessLimiter),
  asyncHandler(authController.sessionCheck)
);

// POST endpoints for authentication
router.post(
  "/login",
  addRateLimiter(LoginLimiter, EmailTargetLimiter, ExcessLimiter),
  validateData(userValidation.loginUserSchema),
  asyncHandler(authController.login)
);

router.post(
  "/register",
  addRateLimiter(AuthFlowLimiter, ExcessLimiter),
  validateData(userValidation.registerUserSchema),
  asyncHandler(authController.register)
);

router.post(
  "/logout",
  addRateLimiter(AuthFlowLimiter, ExcessLimiter),
  asyncHandler(authController.logout)
);

export default router;
