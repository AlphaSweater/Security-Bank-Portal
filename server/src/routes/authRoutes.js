import express from "express";
import {
  login,
  register,
  logout,
  sessionCheck,
} from "#controllers/authController.js";
import { validateData } from "#middlewares/validationMiddleware.js";
import {
  loginUserSchema,
  registerUserSchema,
} from "#utils/validation/userValidation.js";

const router = express.Router();

// GET endpoints to check authentication status
router.get("/session", sessionCheck);

// POST endpoints for authentication
router.post("/login", validateData(loginUserSchema), login);
router.post("/register", validateData(registerUserSchema), register);
router.post("/logout", logout);

export default router;
