import Joi from "joi";

// =========================
//  Validation Helpers
// =========================

// --- Safe String helper ---
// Returns a Joi string validator with optional min/max, regex + message, label, and email check
const safeString = ({
  minLength = 1,
  maxLength = 128,
  regex,
  regexMsg,
  label = "Value",
  isEmail = false,
} = {}) =>
  Joi.string()
    .trim()
    .min(minLength)
    .max(maxLength)
    .custom((value, helpers) => {
      const errors = [];

      if (isEmail) {
        // Enforce valid email format if specified
        const { error } = Joi.string()
          .email({ tlds: { allow: false } })
          .validate(value);
        if (error) errors.push("a valid email address");
      }

      // Enforce custom regex and message if provided
      if (regex && !regex.test(value)) {
        errors.push(regexMsg || "a valid format");
      }

      // If any errors are found, join for a readable message
      if (errors.length > 0) {
        let errorMsg =
          errors.length === 1
            ? errors[0]
            : errors.length === 2
            ? errors.join(" and ")
            : errors.slice(0, -1).join(", ") +
              ", and " +
              errors[errors.length - 1];
        return helpers.error("string.customInvalid", { errors: errorMsg });
      }

      return value;
    })
    .messages({
      "string.base": `${label} must be a string`,
      "string.empty": `${label} is required`,
      "string.min": `${label} must be at least ${minLength} characters long`,
      "string.max": `${label} must be at most ${maxLength} characters long`,
      "string.customInvalid": `${label} must be {#errors}`,
    });

// --- Safe Password helper ---
// Returns a Joi string validator that enforces password complexity
const safePassword = ({ minLength = 8, maxLength = 128 } = {}) =>
  Joi.string()
    .trim()
    .min(minLength)
    .max(maxLength)
    .required()
    .custom((value, helpers) => {
      const errors = [];

      // Require at least one uppercase, lowercase, digit, and special character
      if (!/[A-Z]/.test(value)) errors.push("one uppercase letter");
      if (!/[a-z]/.test(value)) errors.push("one lowercase letter");
      if (!/[0-9]/.test(value)) errors.push("one digit");
      if (!/[^A-Za-z0-9]/.test(value)) errors.push("one special character");

      // If any complexity requirements are missing, join for a readable message
      if (errors.length > 0) {
        let errorMsg =
          errors.length === 1
            ? errors[0]
            : errors.length === 2
            ? errors.join(" and ")
            : errors.slice(0, -1).join(", ") +
              ", and " +
              errors[errors.length - 1];
        return helpers.error("string.passwordComplexity", { errors: errorMsg });
      }

      return value;
    })
    .messages({
      "string.base": "Password must be a string",
      "string.empty": "Password is required",
      "string.min": `Password must be at least ${minLength} characters long`,
      "string.max": `Password must be at most ${maxLength} characters long`,
      "string.passwordComplexity": "Password must include at least {#errors}",
    });

// =========================
//  User Validation Schemas
// =========================

// --- Registration schema ---
// Validates new user registration input: first & last names, SA ID number, email and password and confirms password
// All fields have strict validation rules and custom error messages
// Unknown fields are stripped to prevent extra data being added
export const registerUserSchema = Joi.object({
  // First name must be a valid string, trimmed, and within length limits
  firstName: safeString({
    label: "First name",
    minLength: 2,
    maxLength: 100,
    regex: /^[A-Za-z\s'-]+$/,
    regexMsg: "letters, spaces, apostrophes, or hyphens only",
  }).required(),
  // Last name must be a valid string, trimmed, and within length limits
  lastName: safeString({
    label: "Last name",
    minLength: 2,
    maxLength: 100,
    regex: /^[A-Za-z\s'-]+$/,
    regexMsg: "letters, spaces, apostrophes, or hyphens only",
  }).required(),
  // South African ID number: 13 digits, valid format
  saIdNumber: safeString({
    label: "SA ID number",
    minLength: 13,
    maxLength: 13,
    regex: /^\d{13}$/,
    regexMsg: "a valid ID number",
  }).required(),
  // Email must be a valid email, trimmed, and within length limits
  email: safeString({
    label: "Email",
    minLength: 5,
    maxLength: 254,
    isEmail: true,
  }).required(),
  // Password must meet complexity requirements
  password: safePassword(),
  // Confirm password must match password exactly
  passwordConfirm: Joi.string()
    .trim()
    .empty("") // Treat empty string as missing
    .required()
    .valid(Joi.ref("password"))
    .messages({
      "string.empty": "Please confirm password",
      "any.required": "Password confirmation is required",
      "any.only": "Passwords must match",
    }),
}).options({ stripUnknown: true });

// --- Login schema ---
// Validates login input. Uses generic error messages to avoid leaking info
export const loginUserSchema = Joi.object({
  // Email: must be a valid email, but error messages are generic
  email: Joi.string()
    .trim()
    .min(5)
    .max(254)
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.base": "Email must be a string",
      "string.empty": "Email is required",
      "string.email": "Invalid email",
      "string.min": "Invalid email",
      "string.max": "Invalid email",
    }),
  // Password: only checks presence and max length, generic errors
  password: Joi.string().trim().min(1).max(128).required().messages({
    "string.base": "Password must be a string",
    "string.empty": "Password is required",
    "any.required": "Password is required",
    "string.min": "Invalid password",
    "string.max": "Invalid password",
  }),
}).options({ stripUnknown: true });

// =========================
//  Joi Error Formatting Helper
// =========================
// Helper to format Joi errors for frontend
export function formatValidationErrors(error) {
  if (!error || !Array.isArray(error.details)) return {};
  const formatted = {};
  const passwordErrors = [];

  error.details.forEach((err) => {
    const field = err.path[0];
    if (field === "password" || field === "passwordConfirm") {
      passwordErrors.push(err.message);
    } else if (field) {
      if (!formatted[field]) formatted[field] = [];
      formatted[field].push(err.message);
    }
  });

  if (passwordErrors.length > 0) {
    // Remove duplicates
    formatted["password"] = [...new Set(passwordErrors)];
  }

  return formatted;
}
