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
// ChatGPT assisted by providing information regarding best practises of security and
// JavaScript.
// As well as on occasion upgrading or improving existing code segments.
// All AI responses were thoroughly review and cross referenced to ensure accuracy and
// academic integrity.
//======================================================================================

import Joi from "joi";

// =========================
//  Validation Helpers
// =========================

// --- Safe String helper ---
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
        const { error } = Joi.string()
          .email({ tlds: { allow: false } })
          .validate(value);
        if (error) errors.push("a valid email address");
      }

      if (regex && !regex.test(value)) {
        errors.push(regexMsg || "a valid format");
      }

      if (errors.length > 0) {
        const errorMsg =
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
      "string.base": `${label} must be text`,
      "string.empty": `${label} is required`,
      "string.min": `${label} must be at least ${minLength} characters`,
      "string.max": `${label} must be ${maxLength} characters or fewer`,
      "string.customInvalid": `${label} must be {#errors}`,
    });

// --- Safe Password helper ---
const safePassword = ({ minLength = 8, maxLength = 128 } = {}) =>
  Joi.string()
    .trim()
    .min(minLength)
    .max(maxLength)
    .required()
    .custom((value, helpers) => {
      const errors = [];

      if (!/[A-Z]/.test(value)) errors.push("an uppercase letter");
      if (!/[a-z]/.test(value)) errors.push("a lowercase letter");
      if (!/[0-9]/.test(value)) errors.push("a number");
      if (!/[^A-Za-z0-9]/.test(value))
        errors.push("a special character (e.g. !, @, #)");

      if (errors.length > 0) {
        const errorMsg =
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
      "string.base": "Password must be text",
      "string.empty": "Password is required",
      "string.min": `Password must be at least ${minLength} characters`,
      "string.max": `Password must be ${maxLength} characters or fewer`,
      "string.passwordComplexity": `Password must include {#errors}`,
    });

// =========================
//  User Validation Schemas
// =========================

// --- Registration schema ---
export const registerUserSchema = Joi.object({
  firstName: safeString({
    label: "First name",
    minLength: 2,
    maxLength: 100,
    regex: /^[A-Za-z\s'-]+$/,
    regexMsg: "letters, spaces, apostrophes, or hyphens only",
  }).required(),

  lastName: safeString({
    label: "Last name",
    minLength: 2,
    maxLength: 100,
    regex: /^[A-Za-z\s'-]+$/,
    regexMsg: "letters, spaces, apostrophes, or hyphens only",
  }).required(),

  saIdNumber: safeString({
    label: "SA ID number",
    minLength: 13,
    maxLength: 13,
    regex: /^\d{13}$/,
    regexMsg: "exactly 13 digits",
  }).required(),

  email: safeString({
    label: "Email",
    minLength: 5,
    maxLength: 254,
    isEmail: true,
  }).required(),

  password: safePassword(),

  passwordConfirm: Joi.string()
    .trim()
    .required()
    .valid(Joi.ref("password"))
    .messages({
      "string.empty": "Please confirm your password",
      "any.required": "Password confirmation is required",
      "any.only": "Passwords do not match",
    }),
})
  .options({ stripUnknown: true })
  .meta({ schemaName: "register" });

// --- Login schema ---
export const loginUserSchema = Joi.object({
  email: Joi.string()
    .trim()
    .min(5)
    .max(254)
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.empty": "Email is required",
      "any.required": "Email is required",
      // keep generic — don’t leak format details
      "string.base": "Invalid email or password",
      "string.email": "Invalid email or password",
      "string.min": "Invalid email or password",
      "string.max": "Invalid email or password",
    }),

  password: Joi.string().trim().min(1).max(128).required().messages({
    "string.empty": "Password is required",
    "any.required": "Password is required",
    // keep generic — don’t leak format details
    "string.base": "Invalid email or password",
    "string.min": "Invalid email or password",
    "string.max": "Invalid email or password",
  }),
})
  .options({ stripUnknown: true })
  .meta({ schemaName: "login" });
