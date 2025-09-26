import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateData } from "#middlewares/validation.js";
import {
  loginUserSchema,
  registerUserSchema,
} from "#utils/validation/userValidation.js";
import {
  setupLoggerSpies,
  teardownLoggerSpies,
  printLoggerSpiesIfFailed,
} from "../../loggerTestSpyHelpers.js";
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
// SECURITY VALIDATION TESTS
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// SECTION 1: LOGIN INPUT SECURITY
// -----------------------------------------------------------------------------
describe("[Login] User Input Security", () => {
  // Set up spies for logger methods
  let spies;

  beforeEach(() => {
    spies = setupLoggerSpies();
  });

  afterEach(() => {
    printLoggerSpiesIfFailed(spies);
    teardownLoggerSpies(spies);
  });

  // --- NoSQL Injection ---
  describe("NoSQL Injection", () => {
    it("should block NoSQL injection attempts in login", () => {
      // Arrange
      const maliciousBody = {
        email: { $ne: null },
        password: { $gt: "" },
      };
      const { req, res, next } = mockExpressObjects(maliciousBody);

      // Log before validation
      logger.info(
        "[TEST] BEFORE validation (login, NoSQL injection):",
        req.body
      );

      // Act
      validateData(loginUserSchema)(req, res, next);

      // Log after validation
      logger.info(
        "[TEST] AFTER validation (login, NoSQL injection):",
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
  });

  // --- XSS ---
  // While login isn't really vulnerable to XSS, we include a test to ensure no weird behavior happens
  describe("Cross-Site Scripting (XSS)", () => {
    it("should block XSS attempts in login email field", () => {
      // Arrange
      const maliciousBody = {
        email: "<script>alert('XSS')</script>@test.com",
        password: "Password1!",
      };
      const { req, res, next } = mockExpressObjects(maliciousBody);

      // Log before validation
      logger.info("[TEST] BEFORE validation (login, XSS):", req.body);

      // Act
      validateData(loginUserSchema)(req, res, next);

      // Log after validation
      logger.info(
        "[TEST] AFTER validation (login, XSS):",
        res.json.mock.calls[0]?.[0]
      );

      // Assert
      expect(res.status).toHaveBeenCalledWith(expect.any(Number));
      if (res.status.mock.calls[0][0] === 400) {
        expect(next).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining("Validation"),
          })
        );
      }
    });
  });
});

// -----------------------------------------------------------------------------
// SECTION 2: REGISTRATION INPUT SECURITY
// -----------------------------------------------------------------------------
describe("[Register] User Input Security", () => {
  // Set up spies for logger methods
  let spies;

  beforeEach(() => {
    spies = setupLoggerSpies();
  });

  afterEach(() => {
    printLoggerSpiesIfFailed(spies);
    teardownLoggerSpies(spies);
  });

  // --- NoSQL Injection ---
  describe("NoSQL Injection", () => {
    it("should block NoSQL injection attempts in all registration fields", () => {
      // Arrange
      const maliciousBody = {
        firstName: { $ne: null },
        lastName: "'; DROP TABLE users; --",
        saIdNumber: { $regex: ".*" },
        email: { $where: "this.password.length > 0" },
        password: { $gt: "" },
        passwordConfirm: "1' OR '1'='1",
        extraMaliciousField: { $eval: "db.users.drop()" },
      };
      const { req, res, next } = mockExpressObjects(maliciousBody);

      // Log before validation
      logger.info(
        "[TEST] BEFORE validation (register, NoSQL injection):",
        req.body
      );

      // Act
      validateData(registerUserSchema)(req, res, next);

      // Log after validation
      logger.info(
        "[TEST] AFTER validation (register, NoSQL injection):",
        res.json.mock.calls[0]?.[0]
      );

      // Assert
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

  // --- XSS ---
  describe("Cross-Site Scripting (XSS)", () => {
    it("should block XSS attempts in firstName field", () => {
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

      // Log before validation
      logger.info(
        "[TEST] BEFORE validation (register, XSS firstName):",
        req.body
      );

      // Act
      validateData(registerUserSchema)(req, res, next);

      // Log after validation
      logger.info(
        "[TEST] AFTER validation (register, XSS firstName):",
        res.json.mock.calls[0]?.[0]
      );

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

    it("should block XSS attempts in all registration fields", () => {
      // Arrange
      const maliciousBody = {
        firstName: "<img src=x onerror=alert('XSS')>",
        lastName: "<svg onload=alert('XSS')>",
        saIdNumber: "javascript:alert('XSS')",
        email: "<script>alert('XSS')</script>@evil.com",
        password: "<iframe src=javascript:alert('XSS')>1",
        passwordConfirm: "<iframe src=javascript:alert('XSS')>1",
      };
      const { req, res, next } = mockExpressObjects(maliciousBody);

      // Log before validation
      logger.info(
        "[TEST] BEFORE validation (register, XSS all fields):",
        req.body
      );

      // Act
      validateData(registerUserSchema)(req, res, next);

      // Log after validation
      logger.info(
        "[TEST] AFTER validation (register, XSS all fields):",
        res.json.mock.calls[0]?.[0]
      );

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
            lastName: expect.stringContaining(
              "letters, spaces, apostrophes, or hyphens only"
            ),
            saIdNumber: expect.any(String),
            email: expect.any(String),
          }),
        })
      );
    });
  });
});

// -----------------------------------------------------------------------------
// SECTION 3: TRANSACTION INPUT SECURITY
// -----------------------------------------------------------------------------
describe("[Transaction] User Input Security", () => {
  // Set up spies for logger methods
  let spies;

  beforeEach(() => {
    spies = setupLoggerSpies();
  });

  afterEach(() => {
    printLoggerSpiesIfFailed(spies);
    teardownLoggerSpies(spies);
  });

  // TODO: Implement Transaction schema and validation tests for NoSQL Injection and XSS
  // Example:
  // describe("NoSQL Injection", () => { ... });
  // describe("Cross-Site Scripting (XSS)", () => { ... });
  it.skip("should validate transaction input security (To Be Implemented)", () => {
    // This test is a placeholder and will be implemented when transaction validation is available
  });
});
