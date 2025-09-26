// server/src/middlewares/validation.js
import { getLogger } from "#utils/logger.js";
const logger = getLogger(import.meta.url);

/**
 * Generic Joi validation middleware for Express
 * @param {import('joi').ObjectSchema} schema - Joi schema to validate against
 * @param {Object} [options]
 * @param {('body'|'query'|'params')} [options.target='body'] - Which part of the request to validate
 * @returns {import('express').RequestHandler}
 */
export function validateData(schema, options = {}) {
  const { target = "body" } = options;
  return (req, res, next) => {
    const env = process.env.NODE_ENV || "development";
    if (env !== "production") {
      logger.debug(`Validating request ${target}`);
      const masked = maskPasswords(req[target]);
      logger.debug(`Request ${target}: ${JSON.stringify(masked)}`);
    }

    let valueToValidate = req[target];
    if (typeof valueToValidate !== "object" || valueToValidate == null) {
      valueToValidate = {};
    }

    let value, error;
    try {
      ({ value, error } = schema.validate(valueToValidate, {
        abortEarly: false,
      }));
    } catch (err) {
      logger.error("Schema validation threw an error", err);
      return res.status(500).json({ message: "Internal validation error" });
    }

    if (error) {
      if (env !== "production") {
      }
      // Get schema name from .meta()
      const schemaName =
        schema.$_terms?.metas?.find((m) => m.schemaName)?.schemaName ||
        "default";
      const formattedErrors = formatJoiError(error, { schema: schemaName });
      if (env !== "production") {
        logger.debug(
          `Formatted validation errors: ${JSON.stringify(formattedErrors)}`
        );
      }
      return res.status(400).json({
        status: "fail",
        message: "Validation errors",
        errors: formattedErrors,
      });
    }

    // Request is valid
    if (env !== "production") {
      logger.debug(`Validated request ${target} successfully!`);
    }

    req[target] = value; // clean validated data
    next();
  };
}

/**
 * Recursively mask password fields in an object for safe logging.
 * @param {Object} obj
 * @returns {Object}
 */
function maskPasswords(obj) {
  if (Array.isArray(obj)) {
    return obj.map(maskPasswords);
  } else if (obj && typeof obj === "object") {
    const masked = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof key === "string" && key.toLowerCase().includes("password")) {
        if (typeof value === "string") {
          masked[key] = "*".repeat(value.length);
        } else {
          masked[key] = "****";
        }
      } else {
        masked[key] = maskPasswords(value);
      }
    }
    return masked;
  }
  return obj;
}

/**
 * Helper to format Joi errors for frontend
 * @param {import('joi').ValidationError} error
 * @param {Object} options
 * @param {string} [options.schema]
 * @param {string} [options.genericKey]
 * @returns {Object|null}
 */

// Helper to format Joi errors for frontend
export function formatJoiError(error, { schema, genericKey = "generic" } = {}) {
  if (!error || !error.details) return null;
  const formatted = {};
  for (const detail of error.details) {
    let field = detail.context?.label || detail.path?.[0] || genericKey;
    // For login schema, only collapse errors with the exact message to generic
    if (
      schema === "login" &&
      (field === "email" || field === "password") &&
      detail.message === "Invalid email or password"
    ) {
      field = genericKey;
    }
    if (!formatted[field]) {
      formatted[field] = detail.message;
    }
  }
  return formatted;
}
