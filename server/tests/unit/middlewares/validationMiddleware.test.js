import { describe, it, expect, vi } from "vitest";
import { validateData } from "#middlewares/validationMiddleware.js";
import {
  loginUserSchema,
  registerUserSchema,
} from "#utils/validationSchemas/userValidation.js";

// --- Helper: mock Express req/res/next ---
function mockExpressObjects(body = {}) {
  const req = { body };
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  const next = vi.fn();
  return { req, res, next };
}

describe("validateData middleware", () => {
  // ------------------------
  // Registration tests
  // ------------------------
  describe("registerUserSchema", () => {
    it("✅ passes validation and sanitizes req.body", () => {
      const validBody = {
        firstName: "John",
        lastName: "Doe",
        saIdNumber: "9001015009087",
        email: "john.doe@example.com",
        password: "Password1!",
        confirmPassword: "Password1!",
        extraField: "should be stripped",
      };

      const { req, res, next } = mockExpressObjects(validBody);

      // Act
      validateData(registerUserSchema)(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();

      // Should strip unknown fields
      expect(req.body).not.toHaveProperty("extraField");

      // Should keep valid fields
      expect(req.body).toMatchObject({
        firstName: "John",
        lastName: "Doe",
        saIdNumber: "9001015009087",
        email: "john.doe@example.com",
        password: "Password1!",
        confirmPassword: "Password1!",
      });
    });

    it("❌ fails validation and returns 400 with error messages", () => {
      const invalidBody = {
        firstName: "J",
        lastName: "",
        saIdNumber: "123",
        email: "not-an-email",
        password: "short",
        confirmPassword: "different",
      };

      const { req, res, next } = mockExpressObjects(invalidBody);

      // Act
      validateData(registerUserSchema)(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Validation error",
          errors: expect.arrayContaining([
            expect.stringContaining("at least 2 characters"),
            expect.stringContaining("is required"),
            expect.stringContaining("must be a valid SA ID number"),
            expect.stringContaining("a valid email address"),
            expect.stringContaining("Password must include at least"),
            expect.stringContaining("Passwords must match"),
          ]),
        })
      );
    });
  });

  // ------------------------
  // Login tests
  // ------------------------
  describe("loginUserSchema", () => {
    it("✅ passes validation and strips unknown fields", () => {
      const validBody = {
        email: "user@example.com",
        password: "anyPassword",
        extra: "strip me",
      };

      const { req, res, next } = mockExpressObjects(validBody);

      validateData(loginUserSchema)(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();

      expect(req.body).not.toHaveProperty("extra");
      expect(req.body).toMatchObject({
        email: "user@example.com",
        password: "anyPassword",
      });
    });

    it("❌ fails validation with bad email", () => {
      const invalidBody = {
        email: "bademail",
        password: "pass",
      };

      const { req, res, next } = mockExpressObjects(invalidBody);

      validateData(loginUserSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Validation error",
          errors: expect.arrayContaining([
            expect.stringContaining("Invalid email or password"),
          ]),
        })
      );
    });

    it("❌ fails validation when password is missing", () => {
      const invalidBody = { email: "user@example.com" };

      const { req, res, next } = mockExpressObjects(invalidBody);

      validateData(loginUserSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Validation error",
          errors: expect.arrayContaining([
            expect.stringContaining('"password" is required'),
          ]),
        })
      );
    });
  });
});
