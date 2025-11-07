//======================================================================================
// Group 2 - Group Members:
//======================================================================================
// Chad Fairlie ST10269509
// Dhiren Ruthenavelu ST10256859
// Kayla Ferreira ST10259527
// Nathan Teixeira ST10249266
//======================================================================================
// References:
//======================================================================================
// ChatGPT greatly assisted in the creation and setup of these tests by providing
// demo data as well as guidance on best practices for testing with Vitest.
// Additionally helping with improving the quality as well as the coverage of the tests.
// All AI responses were thoroughly reviewed and cross referenced to ensure accuracy and
// academic integrity.
//======================================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateData } from "#middlewares/validationMiddleware.js";
import * as userValidation from "#utils/validation/userValidation.js";
import * as transactionValidation from "#utils/validation/transactionValidation.js";
import * as loggerSpyHelper from "../../../loggerTestSpyHelpers.js";
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
// INTEGRATION TESTS
// -----------------------------------------------------------------------------
describe("Integration Tests: User & Transaction Flows", () => {
  let spies;

  beforeEach(() => {
    spies = loggerSpyHelper.setupLoggerSpies();

    // --- Ensure spies always exist to prevent undefined errors ---
    spies.info = spies.info || vi.spyOn(logger, "info");
    spies.error = spies.error || vi.spyOn(logger, "error");
  });

  afterEach(() => {
    loggerSpyHelper.printLoggerSpiesIfFailed(spies);
    loggerSpyHelper.teardownLoggerSpies(spies);
  });

  // ---------------------------------------------------------------------------
  // LOGIN FLOW
  // ---------------------------------------------------------------------------
  describe("[Login] Valid User Flow", () => {
    it("calls next() when login input is valid", () => {
      const validBody = {
        email: "jane@example.com",
        password: "Password1!",
      };
      const { req, res, next } = mockExpressObjects(validBody);

      validateData(userValidation.loginUserSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // REGISTRATION FLOW
  // ---------------------------------------------------------------------------
  describe("[Register] Valid User Flow", () => {
    it("calls next() when registration input is valid", () => {
      const validBody = {
        firstName: "Jane",
        lastName: "Doe",
        saIdNumber: "9001015009087",
        email: "jane@example.com",
        password: "Password1!",
        passwordConfirm: "Password1!",
      };
      const { req, res, next } = mockExpressObjects(validBody);

      validateData(userValidation.registerUserSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
// TRANSACTION FLOW
// ---------------------------------------------------------------------------
describe("[Transaction] Valid Transaction Flow", () => {
  const hex24 = () => "a".repeat(24);

  it("calls next() when transaction input is valid", () => {
    const validBody = {
      userId: hex24(),
      amount: 150,
      currencyCode: "ZAR", // Adjusted to SA Rand for local use
      beneficiaryType: "Individual",
      beneficiaryFullName: "John Doe",
      destinationCountryCode: "ZA", // Valid ISO country code
      destinationBankName: "Bank of Test",
      destinationBankSwift: "TESTZAJJ", // Valid SWIFT code format
      destinationAccountNumber: "1234567890", // 10 digits (valid account length)
      createdAtTimeZone: "Africa/Johannesburg", // ✅ added field
    };

    const { req, res, next } = mockExpressObjects(validBody);

    validateData(transactionValidation.createTransactionSchema)(req, res, next);

    // Debug if test fails
    if (!next.mock.calls.length) {
      console.log("Validation failed response:", res.json.mock.calls[0]);
    }

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
});
