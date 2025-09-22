import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import util from "util";
import { validateData } from "#middlewares/validationMiddleware.js";
import {
  loginUserSchema,
  registerUserSchema,
} from "#utils/validationSchemas/userValidation.js";
import logger from "#utils/logger.js";

// -----------------------------------------------------------------------------
// Helper: mock Express req/res/next objects
// -----------------------------------------------------------------------------
function mockExpressObjects(body = {}) {
  const req = { body };
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  const next = vi.fn();
  return { req, res, next };
}

// -----------------------------------------------------------------------------
// Test Suite: validateData middleware
// -----------------------------------------------------------------------------
describe("validateData middleware", () => {
  let infoSpy, errorSpy, debugSpy;

  // Setup & teardown logger spies
  beforeEach(() => {
    infoSpy = vi.spyOn(logger, "info").mockImplementation(() => {});
    errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});
    debugSpy = vi.spyOn(logger, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    // Print captured logs for debugging, always showing full object/array contents
    if (infoSpy.mock.calls.length > 0) {
      console.log(
        "[logger.info calls]",
        util.inspect(infoSpy.mock.calls, { depth: null, colors: true })
      );
    }
    if (errorSpy.mock.calls.length > 0) {
      console.log(
        "[logger.error calls]",
        util.inspect(errorSpy.mock.calls, { depth: null, colors: true })
      );
    }
    if (debugSpy.mock.calls.length > 0) {
      console.log(
        "[logger.debug calls]",
        util.inspect(debugSpy.mock.calls, { depth: null, colors: true })
      );
    }
    infoSpy.mockRestore();
    errorSpy.mockRestore();
    debugSpy.mockRestore();
  });

  // ---------------------------------------------------------------------------
  // Registration schema tests
  // ---------------------------------------------------------------------------
  describe("registerUserSchema", () => {
    it("passes validation and sanitizes req.body", () => {
      // Arrange
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
      logger.info("[TEST] BEFORE validation (register):", req.body);
      validateData(registerUserSchema)(req, res, next);
      logger.info("[TEST] AFTER validation (register):", req.body);

      // Assert
      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
      expect(req.body).not.toHaveProperty("extraField");
      expect(req.body).toMatchObject({
        firstName: "John",
        lastName: "Doe",
        saIdNumber: "9001015009087",
        email: "john.doe@example.com",
        password: "Password1!",
        confirmPassword: "Password1!",
      });
    });

    it("fails validation and returns 400 with error messages", () => {
      // Arrange
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
      logger.info("[TEST] BEFORE validation (register, invalid):", req.body);
      validateData(registerUserSchema)(req, res, next);
      logger.info(
        "[TEST] AFTER validation (register, invalid):",
        res.json.mock.calls[0]?.[0]
      );

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Validation error",
          errors: expect.arrayContaining([
            expect.stringContaining(
              "First name must be at least 2 characters long"
            ),
            expect.stringContaining("Last name is required"),
            expect.stringContaining(
              "SA ID number must be at least 13 characters long"
            ),
            expect.stringContaining("SA ID number must be a valid ID number"),
            expect.stringContaining("Email must be a valid email address"),
            expect.stringContaining(
              "Password must be at least 8 characters long"
            ),
            expect.stringContaining(
              "Password must include at least one uppercase letter, one digit, and one special character"
            ),
            expect.stringContaining("Passwords must match"),
          ]),
        })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Login schema tests
  // ---------------------------------------------------------------------------
  describe("loginUserSchema", () => {
    it("passes validation and strips unknown fields", () => {
      // Arrange
      const validBody = {
        email: "user@example.com",
        password: "anyPassword",
        extra: "strip me",
      };
      const { req, res, next } = mockExpressObjects(validBody);

      // Act
      logger.info("[TEST] BEFORE validation (login):", req.body);
      validateData(loginUserSchema)(req, res, next);
      logger.info("[TEST] AFTER validation (login):", req.body);

      // Assert
      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
      expect(req.body).not.toHaveProperty("extra");
      expect(req.body).toMatchObject({
        email: "user@example.com",
        password: "anyPassword",
      });
    });

    it("fails validation with bad email", () => {
      // Arrange
      const invalidBody = { email: "bademail", password: "pass" };
      const { req, res, next } = mockExpressObjects(invalidBody);

      // Act
      logger.info("[TEST] BEFORE validation (login, bad email):", req.body);
      validateData(loginUserSchema)(req, res, next);
      logger.info(
        "[TEST] AFTER validation (login, bad email):",
        res.json.mock.calls[0]?.[0]
      );

      // Assert
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

    it("fails validation when password is missing", () => {
      // Arrange
      const invalidBody = { email: "user@example.com" };
      const { req, res, next } = mockExpressObjects(invalidBody);

      // Act
      logger.info(
        "[TEST] BEFORE validation (login, missing password):",
        req.body
      );
      validateData(loginUserSchema)(req, res, next);
      logger.info(
        "[TEST] AFTER validation (login, missing password):",
        res.json.mock.calls[0]?.[0]
      );

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Validation error",
          errors: expect.arrayContaining([
            expect.stringContaining("Password is required"),
          ]),
        })
      );
    });
  });

  // ------------------------
  // Security tests
  // ------------------------
  describe("Security: NoSQL Injection & XSS", () => {
    it("blocks NoSQL injection attempts in login", () => {
      // Arrange
      const maliciousBody = {
        email: { $ne: null }, // typical NoSQL injection attempt
        password: { $gt: "" },
      };

      const { req, res, next } = mockExpressObjects(maliciousBody);

      // Act
      logger.info("[TEST] BEFORE validation (security, NoSQL):", req.body);
      validateData(loginUserSchema)(req, res, next);
      logger.info(
        "[TEST] AFTER validation (security, NoSQL):",
        res.json.mock.calls[0]?.[0]
      );

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Validation error",
        })
      );
    });

    it("blocks XSS attempts in registration", () => {
      // Arrange
      const maliciousBody = {
        firstName: "<script>alert('XSS')</script>",
        lastName: "Doe",
        saIdNumber: "9001015009087",
        email: "xss@example.com",
        password: "Password1!",
        confirmPassword: "Password1!",
      };

      const { req, res, next } = mockExpressObjects(maliciousBody);

      // Act
      logger.info("[TEST] BEFORE validation (security, XSS):", req.body);
      validateData(registerUserSchema)(req, res, next);
      logger.info(
        "[TEST] AFTER validation (security, XSS):",
        res.json.mock.calls[0]?.[0]
      );

      // Debug: If status was not called, log the calls
      if (!res.status.mock.calls.length) {
        logger.error(
          "[TEST][XSS] res.status was not called! Calls:",
          res.status.mock.calls
        );
        logger.error("[TEST][XSS] res.json calls:", res.json.mock.calls);
      }

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Validation error",
          errors: expect.arrayContaining([
            expect.stringContaining(
              "letters, spaces, apostrophes, or hyphens only"
            ),
          ]),
        })
      );
    });
  });
});
