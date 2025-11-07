//======================================================================================
//Group 2 - Group Members:
//======================================================================================
// Chad Fairlie ST10269509
// Dhiren Ruthenavelu ST10256859
// Kayla Ferreira ST10259527
// Nathan Teixeira ST10249266
//======================================================================================
//References:
//======================================================================================
// ChatGPT greatly assisted in the creation and setup of these tests by providing
// demo data as well as guidance on best practices for testing with Vitest.
// Additionally helping with improving the quality as well as the coverage of the tests.
// All AI responses were thoroughly review and cross referenced to ensure accuracy and
// academic integrity.
//======================================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateData } from "#middlewares/validationMiddleware.js";
import * as transactionValidation from "#utils/validation/transactionValidation.js";
import * as loggerSpyHelper from "../../../loggerTestSpyHelpers.js";
import logger from "#utils/logger.js";

// -----------------------------------------------------------------------------
// Helper: mock Express req/res/next objects
// -----------------------------------------------------------------------------
function mockExpressObjects({ body = {}, params = {} } = {}) {
  const req = { body, params };
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  const next = vi.fn();
  return { req, res, next };
}

// Simple helper to make a 24-char hex id
const hex24 = () => "a".repeat(24);

// -----------------------------------------------------------------------------
// TRANSACTION DATA VALIDATION TESTS
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// SECTION 1: CREATE TRANSACTION INPUT VALIDATION
// -----------------------------------------------------------------------------
describe("[Transaction] Create Data Validation", () => {
  let spies;

  beforeEach(() => {
    spies = loggerSpyHelper.setupLoggerSpies();
  });

  afterEach(() => {
    loggerSpyHelper.printLoggerSpiesIfFailed(spies);
    loggerSpyHelper.teardownLoggerSpies(spies);
  });

  describe("Valid Input", () => {
    it("should pass validation and strip unknown fields", () => {
      // Arrange
      const validBody = {
        userId: hex24(),
        amount: 250.5,
        currencyCode: "USD",
        beneficiaryType: "Individual",
        beneficiaryFullName: "Jane O'Connor & Sons - International",
        beneficiaryNote: "Rent",
        destinationCountryCode: "US",
        destinationBankName: "Bank of America",
        destinationBankSwift: "BOFAUS3N",
        destinationAccountNumber: "GB29 NWBK 6016 1331 9268 19",
        createdAtTimeZone: "Africa/Johannesburg",
        extra: "strip me",
      };
      const { req, res, next } = mockExpressObjects({ body: validBody });

      logger.info("[TEST] BEFORE validation (create, valid):", req.body);

      // Act
      validateData(transactionValidation.createTransactionSchema)(
        req,
        res,
        next
      );

      logger.info("[TEST] AFTER validation (create, valid):", req.body);

      // Assert
      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
      expect(req.body).not.toHaveProperty("extra");
      // Ensure status was not permitted even if provided (we did not provide status here)
      expect(req.body).not.toHaveProperty("status");
      // Sanity: keys present
      expect(Object.keys(req.body)).toEqual(
        expect.arrayContaining([
          "userId",
          "amount",
          "currencyCode",
          "beneficiaryType",
          "beneficiaryFullName",
          "beneficiaryNote",
          "destinationCountryCode",
          "destinationBankName",
          "destinationBankSwift",
          "destinationAccountNumber",
          "createdAtTimeZone",
        ])
      );
    });
  });

  describe("Invalid Input", () => {
    it("should fail validation with multiple field errors and forbidden status", () => {
      // Arrange
      const invalidBody = {
        userId: "shortid", // not 24 hex
        amount: 0, // must be > 0
        currencyCode: "USDD", // invalid
        beneficiaryType: "Person", // invalid
        beneficiaryFullName: "<script>alert('x')</script>", // illegal chars
        beneficiaryNote: "x".repeat(500), // too long
        destinationCountryCode: "USA", // invalid
        destinationBankName: "<b>H@x Bank</b>", // illegal chars
        destinationBankSwift: "BADCODE", // invalid
        destinationAccountNumber: "!!!", // invalid
        createdAtTimeZone: "Not/AZone", // invalid pattern
        status: "approved", // forbidden on create
      };
      const { req, res, next } = mockExpressObjects({ body: invalidBody });

      logger.info("[TEST] BEFORE validation (create, invalid):", req.body);

      // Act
      validateData(transactionValidation.createTransactionSchema)(
        req,
        res,
        next
      );

      logger.info(
        "[TEST] AFTER validation (create, invalid):",
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
            userId: expect.any(String),
            amount: expect.any(String),
            currencyCode: expect.any(String),
            beneficiaryType: expect.any(String),
            beneficiaryFullName: expect.any(String),
            beneficiaryNote: expect.any(String),
            destinationCountryCode: expect.any(String),
            destinationBankName: expect.any(String),
            destinationBankSwift: expect.any(String),
            destinationAccountNumber: expect.any(String),
            createdAtTimeZone: expect.any(String),
            status: expect.any(String), // forbidden field
          }),
        })
      );
    });
  });
});

// -----------------------------------------------------------------------------
// SECTION 2: UPDATE STATUS VALIDATION (params + body)
// -----------------------------------------------------------------------------
describe("[Transaction] Update Status Validation", () => {
  let spies;

  beforeEach(() => {
    spies = loggerSpyHelper.setupLoggerSpies();
  });

  afterEach(() => {
    loggerSpyHelper.printLoggerSpiesIfFailed(spies);
    loggerSpyHelper.teardownLoggerSpies(spies);
  });

  it("should pass params id and body status with optional reviewReason", () => {
    // Arrange
    const { req, res, next } = mockExpressObjects({
      params: { id: hex24() },
      body: { _id: hex24(), status: "approved", reviewReason: "All good" },
    });

    // Validate params
    validateData(transactionValidation.transactionIdSchema, {
      target: "params",
    })(req, res, next);
    expect(next).toHaveBeenCalled();

    // Reset next for body validation
    next.mockReset();

    // Validate body
    validateData(transactionValidation.updateTransactionStatusSchema)(
      req,
      res,
      next
    );
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should fail when status is invalid and reason too long", () => {
    // Arrange
    const { req, res, next } = mockExpressObjects({
      params: { id: "bad" },
      body: { _id: "alsoBad", status: "done", reviewReason: "x".repeat(1000) },
    });

    // Params should fail
    validateData(transactionValidation.transactionIdSchema, {
      target: "params",
    })(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    res.status.mockClear();
    res.json.mockClear();
    next.mockReset();

    // Body should fail
    validateData(transactionValidation.updateTransactionStatusSchema)(
      req,
      res,
      next
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});
