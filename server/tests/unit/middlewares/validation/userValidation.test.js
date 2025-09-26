import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateData } from "#middlewares/validationMiddleware.js";
import * as userValidation from "#utils/validation/userValidation.js";
import * as loggerSpyHelper from "../../loggerTestSpyHelpers.js";
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
// USER DATA VALIDATION TESTS
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// SECTION 1: LOGIN INPUT VALIDATION
// -----------------------------------------------------------------------------
describe("[Login] User Data Validation", () => {
  // Set up spies for logger methods
  let spies;

  beforeEach(() => {
    spies = loggerSpyHelper.setupLoggerSpies();
  });

  afterEach(() => {
    loggerSpyHelper.printLoggerSpiesIfFailed(spies);
    loggerSpyHelper.teardownLoggerSpies(spies);
  });

  // --- Valid Input ---
  describe("Valid Input", () => {
    it("should pass validation and strip unknown fields", () => {
      // Arrange
      const validBody = {
        email: "user@example.com",
        password: "anyPassword",
        extra: "strip me",
      };
      const { req, res, next } = mockExpressObjects(validBody);

      // Log before validation
      logger.info("[TEST] BEFORE validation (login, valid):", req.body);

      // Act
      validateData(userValidation.loginUserSchema)(req, res, next);

      // Log after validation
      logger.info("[TEST] AFTER validation (login, valid):", req.body);

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
  });

  // --- Invalid Input ---
  describe("Invalid Input", () => {
    it("should fail validation with bad email (generic error key)", () => {
      // Arrange
      const invalidBody = { email: "bademail", password: "pass" };
      const { req, res, next } = mockExpressObjects(invalidBody);

      // Log before validation
      logger.info("[TEST] BEFORE validation (login, bad email):", req.body);

      // Act
      validateData(userValidation.loginUserSchema)(req, res, next);

      // Log after validation
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

    it("should fail validation when password is missing (password error key)", () => {
      // Arrange
      const invalidBody = { email: "user@example.com" };
      const { req, res, next } = mockExpressObjects(invalidBody);

      // Log before validation
      logger.info(
        "[TEST] BEFORE validation (login, missing password):",
        req.body
      );

      // Act
      validateData(userValidation.loginUserSchema)(req, res, next);

      // Log after validation
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
});

// -----------------------------------------------------------------------------
// SECTION 2: REGISTRATION INPUT VALIDATION
// -----------------------------------------------------------------------------
describe("[Register] User Data Validation", () => {
  // Set up spies for logger methods
  let spies;

  beforeEach(() => {
    spies = loggerSpyHelper.setupLoggerSpies();
  });

  afterEach(() => {
    loggerSpyHelper.printLoggerSpiesIfFailed(spies);
    loggerSpyHelper.teardownLoggerSpies(spies);
  });

  // --- Valid Input ---
  describe("Valid Input", () => {
    it("should pass validation and sanitize req.body (unknown fields stripped)", () => {
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

      // Log before validation
      logger.info("[TEST] BEFORE validation (register, valid):", req.body);

      // Act
      validateData(userValidation.registerUserSchema)(req, res, next);

      // Log after validation
      logger.info("[TEST] AFTER validation (register, valid):", req.body);

      // Assert
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
  });

  // --- Invalid Input ---
  describe("Invalid Input", () => {
    it("should fail validation and return 400 with all error keys present and string values", () => {
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

      // Log before validation
      logger.info("[TEST] BEFORE validation (register, invalid):", req.body);

      // Act
      validateData(userValidation.registerUserSchema)(req, res, next);

      // Log after validation
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
});
