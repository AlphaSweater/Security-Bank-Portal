// server/src/middlewares/validationMiddleware.js
import { getLogger } from "#utils/logger.js";
const logger = getLogger(import.meta.url);

/**
 * Joi validation middleware for Express.
 * Validates req.body, req.query, or req.params based on options.target.
 * Logs request data when in development.
 * @param {import('joi').ObjectSchema} schema - Joi schema to validate against
 * @param {Object} [options]
 * @param {('body'|'query'|'params')} [options.target='body'] - Which part of the request to validate
 * @returns {Function} Express middleware
 */
export function validateData(schema, options = {}) {
  // Default to validating req.body
  const target = options.target || "body";

  return (req, res, next) => {
    const isDev = (process.env.NODE_ENV || "development") !== "production";

    // Mask password fields for logging
    if (isDev) {
      logger.debug(`Validating request ${target}`);
      logger.debug(
        `Request ${target}: ${JSON.stringify(maskPasswords(req[target]))}`
      );
    }

    // Always validate an object (never null/undefined)
    const data =
      typeof req[target] === "object" && req[target] !== null
        ? req[target]
        : {};

    // Validate using Joi
    const result = schema.validate(data, { abortEarly: false });

    if (result.error) {
      // Get schema name for error formatting (if set)
      let schemaName = "default";
      if (schema.$_terms && schema.$_terms.metas) {
        const meta = schema.$_terms.metas.find((m) => m.schemaName);
        if (meta && meta.schemaName) schemaName = meta.schemaName;
      }
      const errors = formatJoiError(result.error, { schema: schemaName });
      if (isDev) {
        logger.debug(`Validation errors: ${JSON.stringify(errors)}`);
      }
      return res.status(400).json({
        status: "fail",
        message: "Validation errors",
        errors,
      });
    }

    // If valid, replace req[target] with validated data
    req[target] = result.value;
    if (isDev) {
      logger.debug(`Validated request ${target} successfully!`);
    }
    next();
  };
}

// --- Helpers below ---

// Mask password fields in an object (for logging only)
function maskPasswords(obj) {
  if (Array.isArray(obj)) return obj.map(maskPasswords);
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof key === "string" && key.toLowerCase().includes("password")) {
        out[key] =
          typeof value === "string" ? "*".repeat(value.length) : "****";
      } else {
        out[key] = maskPasswords(value);
      }
    }
    return out;
  }
  return obj;
}

// Format Joi errors for frontend (grouped by field)
export function formatJoiError(error, { schema, genericKey = "generic" } = {}) {
  if (!error || !error.details) return null;
  const out = {};
  for (const detail of error.details) {
    let field = detail.context?.label || detail.path?.[0] || genericKey;
    // For login schema, collapse certain errors to generic
    if (
      schema === "login" &&
      (field === "email" || field === "password") &&
      detail.message === "Invalid email or password"
    ) {
      field = genericKey;
    }
    if (!out[field]) {
      out[field] = detail.message;
    }
  }
  return out;
}
