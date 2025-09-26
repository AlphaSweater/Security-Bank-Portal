import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import util from "util";
import { validateData } from "#middlewares/validation.js";
import {
  loginUserSchema,
  registerUserSchema,
} from "#utils/validation/userValidation.js";
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
        passwordConfirm: "Password1!",
        extraField: "should be stripped",
      };
      const { req, res, next } = mockExpressObjects(validBody);

      // Act
      logger.info("[TEST] BEFORE validation (register):", req.body);
      validateData(registerUserSchema)(req, res, next);
      logger.info("[TEST] AFTER validation (register):", req.body);

      // Check only expected fields remain, unknown fields stripped
      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
      expect(req.body).not.toHaveProperty("extraField");
      expect(Object.keys(req.body).sort()).toEqual(
        [
          "email",
          "firstName",
          "lastName",
          "password",
          "passwordConfirm",
          "saIdNumber",
        ].sort()
      );
      expect(req.body).toMatchObject({
        firstName: "John",
        lastName: "Doe",
        saIdNumber: "9001015009087",
        email: "john.doe@example.com",
        password: "Password1!",
        passwordConfirm: "Password1!",
      });
    });

    // Checks all expected error keys are present and values are strings
    it("fails validation and returns 400 with error messages (all error keys present, all string values)", () => {
      // Arrange
      const invalidBody = {
        firstName: "J",
        lastName: "",
        saIdNumber: "123",
        email: "not-an-email",
        password: "short",
        passwordConfirm: "different",
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
      const result = res.json.mock.calls[0][0];
      expect(req.body).not.toHaveProperty("extraField");
      expect(Object.keys(result.errors).sort()).toEqual(
        [
          "firstName",
          "lastName",
          "saIdNumber",
          "email",
          "password",
          "passwordConfirm",
        ].sort()
      );
      expect(result).toEqual(
        expect.objectContaining({
          message: "Validation errors",
          errors: expect.objectContaining({
            firstName: expect.any(String),
            lastName: expect.any(String),
            saIdNumber: expect.any(String),
            email: expect.any(String),
            password: expect.any(String),
            passwordConfirm: expect.any(String),
          }),
        })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Login schema tests
  // ---------------------------------------------------------------------------
  describe("loginUserSchema", () => {
    // Checks only expected fields remain after validation
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
      expect(Object.keys(req.body).sort()).toEqual(
        ["email", "password"].sort()
      );
      expect(req.body).toMatchObject({
        email: "user@example.com",
        password: "anyPassword",
      });
    });

    // Checks generic error key for login failures
    it("fails validation with bad email (generic error key)", () => {
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
      const result = res.json.mock.calls[0][0];
      expect(Object.keys(result.errors)).toEqual(["generic"]);
      expect(result).toEqual(
        expect.objectContaining({
          message: "Validation errors",
          errors: expect.objectContaining({
            generic: expect.any(String),
          }),
        })
      );
    });

    // Checks password error key for missing password
    it("fails validation when password is missing (password error key)", () => {
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
      const result = res.json.mock.calls[0][0];
      expect(Object.keys(result.errors)).toEqual(["password"]);
      expect(result).toEqual(
        expect.objectContaining({
          message: "Validation errors",
          errors: expect.objectContaining({
            password: expect.any(String),
          }),
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
          message: "Validation errors",
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
        passwordConfirm: "Password1!",
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
          message: "Validation errors",
          errors: expect.objectContaining({
            firstName: expect.stringContaining(
              "letters, spaces, apostrophes, or hyphens only"
            ),
          }),
        })
      );
    });

    it("blocks comprehensive XSS attempts across all registration fields", () => {
      // Arrange - test various XSS payloads in every field
      const maliciousBody = {
        firstName: "<img src=x onerror=alert('XSS')>",
        lastName: "<svg onload=alert('XSS')>",
        saIdNumber: "javascript:alert('XSS')",
        email: "<script>alert('XSS')</script>@evil.com",
        password: "<iframe src=javascript:alert('XSS')>1",
        passwordConfirm: "<iframe src=javascript:alert('XSS')>1",
      };

      const { req, res, next } = mockExpressObjects(maliciousBody);

      // Act
      logger.info("[TEST] BEFORE validation (comprehensive XSS):", req.body);
      validateData(registerUserSchema)(req, res, next);
      logger.info(
        "[TEST] AFTER validation (comprehensive XSS):",
        res.json.mock.calls[0]?.[0]
      );

      // Assert - should fail validation on multiple fields
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Validation errors",
          errors: expect.objectContaining({
            firstName: expect.stringContaining(
              "letters, spaces, apostrophes, or hyphens only"
            ),
            lastName: expect.stringContaining(
              "letters, spaces, apostrophes, or hyphens only"
            ),
            saIdNumber: expect.any(String),
            email: expect.any(String),
          }),
        })
      );
    });

    it("blocks comprehensive injection attempts across all registration fields", () => {
      // Arrange - test various injection payloads in every field
      const maliciousBody = {
        firstName: { $ne: null }, // NoSQL injection object
        lastName: "'; DROP TABLE users; --", // SQL injection
        saIdNumber: { $regex: ".*" }, // NoSQL regex injection
        email: { $where: "this.password.length > 0" }, // NoSQL where injection
        password: { $gt: "" }, // NoSQL comparison injection
        passwordConfirm: "1' OR '1'='1", // SQL injection
        extraMaliciousField: { $eval: "db.users.drop()" }, // Should be stripped
      };

      const { req, res, next } = mockExpressObjects(maliciousBody);

      // Act
      logger.info(
        "[TEST] BEFORE validation (comprehensive injection):",
        req.body
      );
      validateData(registerUserSchema)(req, res, next);
      logger.info(
        "[TEST] AFTER validation (comprehensive injection):",
        res.json.mock.calls[0]?.[0]
      );

      // Assert - should fail validation due to non-string types
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
      const result = res.json.mock.calls[0][0];
      expect(result).toEqual(
        expect.objectContaining({
          message: "Validation errors",
          errors: expect.objectContaining({
            firstName: expect.any(String),
            lastName: expect.any(String),
            saIdNumber: expect.any(String),
            email: expect.any(String),
            password: expect.any(String),
            passwordConfirm: expect.any(String),
          }),
        })
      );
    });
  });
});
