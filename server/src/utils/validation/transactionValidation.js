import Joi from "joi";

// =========================
//  Validation Helpers
// =========================

// --- Join unmet-requirements into a friendly English list ---
const joinErrors = (list) =>
  list.length === 1
    ? list[0]
    : list.length === 2
    ? list.join(" and ")
    : list.slice(0, -1).join(", ") + ", and " + list[list.length - 1];

// --- Safe String helper (same style as your existing one) ---
const safeString = ({
  minLength = 1,
  maxLength = 128,
  regex,
  regexMsg,
  label = "Value",
} = {}) =>
  Joi.string()
    .trim()
    .min(minLength)
    .max(maxLength)
    .custom((value, helpers) => {
      const errors = [];
      if (regex && !regex.test(value)) {
        errors.push(regexMsg || "a valid format");
      }
      if (errors.length > 0) {
        return helpers.error("string.customInvalid", {
          errors: joinErrors(errors),
        });
      }
      return value;
    })
    .messages({
      "string.base": `${label} must be text`,
      "string.empty": `${label} is required`,
      "string.min": `${label} must be at least ${minLength} characters`,
      "string.max": `${label} must be ${maxLength} characters or fewer`,
      "string.customInvalid": `${label} must be {#errors}`,
    });

// --- ObjectId helper (24 hex) ---
const objectId = (label = "ID") =>
  Joi.string()
    .trim()
    .length(24)
    .hex()
    .messages({
      "string.base": `${label} must be text`,
      "string.empty": `${label} is required`,
      "string.length": `${label} must be 24 characters`,
      "string.hex": `${label} must be a 24-char hex string`,
    });

// --- Currency code (ISO 4217) ---
const currencyCode = (label = "Currency code") =>
  Joi.string()
    .trim()
    .uppercase()
    .pattern(/^[A-Z]{3}$/)
    .messages({
      "string.base": `${label} must be text`,
      "string.empty": `${label} is required`,
      "string.pattern.base": `${label} must be a 3-letter ISO code (e.g. USD)`,
    });

// --- Country code (ISO 3166-1 alpha-2) ---
const countryCode = (label = "Country code") =>
  Joi.string()
    .trim()
    .uppercase()
    .pattern(/^[A-Z]{2}$/)
    .messages({
      "string.base": `${label} must be text`,
      "string.empty": `${label} is required`,
      "string.pattern.base": `${label} must be a 2-letter ISO code (e.g. US)`,
    });

// --- SWIFT/BIC (8 or 11 chars) ---
// Pattern: 4 letters bank + 2 letters country + 2 alnum location + optional 3 alnum branch
const swiftBic = (label = "SWIFT/BIC") =>
  Joi.string()
    .trim()
    .uppercase()
    .pattern(/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/)
    .messages({
      "string.base": `${label} must be text`,
      "string.empty": `${label} is required`,
      "string.pattern.base": `${label} must be 8 or 11 chars (e.g. DEUTDEFF or DEUTDEFF500)`,
    });

// --- Account number (generic, cross-bank) ---
// Allows letters/numbers/space/hyphen; 6–34 chars to cover many formats incl. IBAN-like lengths
const accountNumber = (label = "Destination account number") =>
  Joi.string()
    .trim()
    .min(6)
    .max(34)
    .pattern(/^[A-Za-z0-9\- ]+$/)
    .messages({
      "string.base": `${label} must be text`,
      "string.empty": `${label} is required`,
      "string.min": `${label} must be at least 6 characters`,
      "string.max": `${label} must be 34 characters or less`,
      "string.pattern.base": `${label} may include letters, numbers, spaces, and hyphens`,
    });

// --- Amount (money, > 0) ---
const moneyAmount = (label = "Amount", { max = 999_999_999_999_999 } = {}) =>
  Joi.number()
    .greater(0)
    .max(max)
    .precision(2)
    .messages({
      "number.base": `${label} must be a number`,
      "number.greater": `${label} must be greater than 0`,
      "number.max": `${label} must be ${max} or less`,
      "number.precision": `${label} can have at most 2 decimal places`,
    });

// =========================
//  Transaction Validation Schemas
// =========================

// --- Create Transaction schema ---
export const createTransactionSchema = Joi.object({
  // IDs
  userId: objectId("User ID").required(),

  // Money
  amount: moneyAmount("Amount").required(),
  currencyCode: currencyCode("Currency code").required(),

  // Beneficiary
  beneficiaryType: Joi.string()
    .valid("Individual", "Business")
    .required()
    .messages({
      "any.only": "Beneficiary type must be Individual or Business",
      "any.required": "Beneficiary type is required",
    }),

  beneficiaryFullName: safeString({
    label: "Beneficiary name",
    minLength: 2,
    maxLength: 120,
    // Allow letters, digits, spaces, apostrophes, ampersand, dot, parentheses, hyphen
    regex: /^[A-Za-z0-9\s'&().-]+$/,
    regexMsg: "letters, numbers, spaces, and ' & ( ) . - only",
  }).required(),

  beneficiaryNote: Joi.string().trim().max(200).allow("").messages({
    "string.base": "Beneficiary note must be text",
    "string.max": "Beneficiary note must be 200 characters or fewer",
  }),

  // Destination
  destinationCountryCode: countryCode("Destination country").required(),
  destinationBankName: safeString({
    label: "Destination bank name",
    minLength: 2,
    maxLength: 120,
    regex: /^[A-Za-z0-9\s'&().-]+$/,
    regexMsg: "letters, numbers, spaces, and ' & ( ) . - only",
  }).required(),
  destinationBankSwift: swiftBic("SWIFT/BIC").required(),
  destinationAccountNumber: accountNumber().required(),

  // Status (defaults to pending on create; allow explicit set if you need)
  status: Joi.string()
    .valid("pending", "approved", "rejected")
    .default("pending")
    .messages({
      "any.only": "Status must be pending, approved, or rejected",
    }),
})
  .options({ stripUnknown: true, abortEarly: false })
  .meta({ schemaName: "transaction:create" });

// --- Update Transaction Status schema (minimal, server-side use) ---
export const updateTransactionStatusSchema = Joi.object({
  _id: objectId("Transaction ID").required(),
  status: Joi.string()
    .valid("pending", "approved", "rejected")
    .required()
    .messages({
      "any.only": "Status must be pending, approved, or rejected",
      "any.required": "Status is required",
    }),
})
  .options({ stripUnknown: true, abortEarly: false })
  .meta({ schemaName: "transaction:updateStatus" });

// --- Query/Lookup schema (optional) ---
export const getTransactionSchema = Joi.object({
  _id: objectId("Transaction ID").required(),
})
  .options({ stripUnknown: true, abortEarly: false })
  .meta({ schemaName: "transaction:get" });
