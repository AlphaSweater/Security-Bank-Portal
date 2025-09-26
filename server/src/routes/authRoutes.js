import express from "express";
import * as authController from "#controllers/authController.js";
import { validateData } from "#middlewares/validationMiddleware.js";
import * as userValidation from "#utils/validation/userValidation.js";
import { asyncHandler } from "#utils/asyncHandler.js";

const router = express.Router();

// GET endpoints to check authentication status
router.get("/sessionCheck", asyncHandler(authController.sessionCheck));

// POST endpoints for authentication
router.post(
  "/login",
  validateData(userValidation.loginUserSchema),
  asyncHandler(authController.login)
);
router.post(
  "/register",
  validateData(userValidation.registerUserSchema),
  asyncHandler(authController.register)
);
router.post("/logout", asyncHandler(authController.logout));

export default router;
