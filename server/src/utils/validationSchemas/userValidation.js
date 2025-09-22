import Joi from "joi";

// Helper for safe string validation

// --- Safe String helper ---
export const safeString = ({
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
        // Joi has built-in email check, but we can still catch it manually
        const emailSchema = Joi.string().email({ tlds: { allow: false } });
        const { error } = emailSchema.validate(value);
        if (error) errors.push("a valid email address");
      }

      if (regex && !regex.test(value)) {
        errors.push(regexMsg || "a valid format");
      }

      if (errors.length > 0) {
        return helpers.error("string.customInvalid", { errors });
      }

      return value;
    })
    .messages({
      "string.base": `${label} must be a string`,
      "string.empty": `${label} is required`,
      "string.min": `${label} must be at least ${minLength} characters`,
      "string.max": `${label} must be at most ${maxLength} characters`,
      "string.customInvalid": `${label} must be {#errors}`, // will join multiple
    });

// --- Safe Password helper ---
export const safePassword = ({ minLength = 8, maxLength = 128 } = {}) =>
  Joi.string()
    .trim()
    .min(minLength)
    .max(maxLength)
    .custom((value, helpers) => {
      const errors = [];

      if (!/[A-Z]/.test(value)) errors.push("one uppercase letter");
      if (!/[a-z]/.test(value)) errors.push("one lowercase letter");
      if (!/[0-9]/.test(value)) errors.push("one digit");
      if (!/[^A-Za-z0-9]/.test(value)) errors.push("one special character");

      if (errors.length > 0) {
        return helpers.error("string.passwordComplexity", { errors });
      }

      return value;
    })
    .messages({
      "string.min": `Password must be at least ${minLength} characters`,
      "string.max": `Password must be at most ${maxLength} characters`,
      "string.passwordComplexity": "Password must include at least {#errors}", // Joi inserts errors array
    });

// --- Validation Schemas ---

// Registration schema
export const registerUserSchema = Joi.object({
  email: safeString({
    minLength: 5,
    maxLength: 254,
    label: "Email",
    isEmail: true,
  }).required(),
  password: safePassword().required(),
}).options({ stripUnknown: true });

// Login schema
export const loginUserSchema = Joi.object({
  // Use regular JOI string with neutral messages for login to avoid info leaks
  email: Joi.string()
    .trim()
    .min(5)
    .max(254)
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.empty": "Email is required",
      "string.email": "Invalid email or password",
      "string.min": "Invalid email or password",
      "string.max": "Invalid email or password",
    }),
  password: Joi.string().trim().min(1).max(128).required().messages({
    "string.empty": "Password is required",
    "string.max": "Invalid email or password",
  }),
}).options({ stripUnknown: true });
