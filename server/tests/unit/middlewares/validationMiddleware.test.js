import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateData } from "#middlewares/validationMiddleware.js";
import {
  loginUserSchema,
  registerUserSchema,
} from "#utils/validationSchemas/userValidation.js";
import logger from "#utils/logger.js";

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
  let infoSpy, errorSpy, debugSpy;

  beforeEach(() => {
    infoSpy = vi.spyOn(logger, "info").mockImplementation(() => {});
    errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});
    debugSpy = vi.spyOn(logger, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    // Print logs for review (not for assertions)
    if (infoSpy.mock.calls.length > 0) {
      // eslint-disable-next-line no-console
      console.log("[logger.info calls]", infoSpy.mock.calls);
    }
    if (errorSpy.mock.calls.length > 0) {
      // eslint-disable-next-line no-console
      console.log("[logger.error calls]", errorSpy.mock.calls);
    }
    if (debugSpy.mock.calls.length > 0) {
      // eslint-disable-next-line no-console
      console.log("[logger.debug calls]", debugSpy.mock.calls);
    }
    infoSpy.mockRestore();
    errorSpy.mockRestore();
    debugSpy.mockRestore();
  });
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
      logger.info(
        "[TEST] BEFORE validation (register):",
        JSON.stringify(req.body)
      );
      validateData(registerUserSchema)(req, res, next);
      logger.info(
        "[TEST] AFTER validation (register):",
        JSON.stringify(req.body)
      );

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
      logger.info("[TEST] Registration validation PASSED");
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

      logger.info(
        "[TEST] BEFORE validation (register, invalid):",
        JSON.stringify(req.body)
      );
      validateData(registerUserSchema)(req, res, next);
      logger.info(
        "[TEST] AFTER validation (register, invalid): status=%s",
        res.status.mock.calls[0]?.[0]
      );
      logger.info(
        "[TEST] AFTER validation (register, invalid): response=",
        JSON.stringify(res.json.mock.calls[0]?.[0])
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Validation error",
          errors: expect.arrayContaining([
            // These match the new, natural error message style
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
      logger.info("[TEST] Registration validation FAILED as expected");
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

      logger.info(
        "[TEST] BEFORE validation (login):",
        JSON.stringify(req.body)
      );
      validateData(loginUserSchema)(req, res, next);
      logger.info("[TEST] AFTER validation (login):", JSON.stringify(req.body));

      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
      expect(req.body).not.toHaveProperty("extra");
      expect(req.body).toMatchObject({
        email: "user@example.com",
        password: "anyPassword",
      });
      logger.info("[TEST] Login validation PASSED");
    });

    it("❌ fails validation with bad email", () => {
      const invalidBody = {
        email: "bademail",
        password: "pass",
      };

      const { req, res, next } = mockExpressObjects(invalidBody);

      logger.info(
        "[TEST] BEFORE validation (login, bad email):",
        JSON.stringify(req.body)
      );
      validateData(loginUserSchema)(req, res, next);
      logger.info(
        "[TEST] AFTER validation (login, bad email): status=%s",
        res.status.mock.calls[0]?.[0]
      );
      logger.info(
        "[TEST] AFTER validation (login, bad email): response=",
        JSON.stringify(res.json.mock.calls[0]?.[0])
      );

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
      logger.info("[TEST] Login validation FAILED as expected (bad email)");
    });

    it("❌ fails validation when password is missing", () => {
      const invalidBody = { email: "user@example.com" };

      const { req, res, next } = mockExpressObjects(invalidBody);

      logger.info(
        "[TEST] BEFORE validation (login, missing password):",
        JSON.stringify(req.body)
      );
      validateData(loginUserSchema)(req, res, next);
      logger.info(
        "[TEST] AFTER validation (login, missing password): status=%s",
        res.status.mock.calls[0]?.[0]
      );
      logger.info(
        "[TEST] AFTER validation (login, missing password): response=",
        JSON.stringify(res.json.mock.calls[0]?.[0])
      );

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
      logger.info(
        "[TEST] Login validation FAILED as expected (missing password)"
      );
    });
  });
});
