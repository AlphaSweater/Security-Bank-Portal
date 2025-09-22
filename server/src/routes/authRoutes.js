import express from "express";
import { login, logout, register } from "#controllers/authController.js";
import { validateData } from "#middlewares/validationMiddleware.js";
import {
  loginUserSchema,
  registerUserSchema,
} from "#utils/validationSchemas/userValidation.js";

const router = express.Router();

router.post("/login", validateData(loginUserSchema), login);
router.post("/register", validateData(registerUserSchema), register);
router.post("/logout", logout);

export default router;
