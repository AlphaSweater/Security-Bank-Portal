import { getLogger } from "#utils/logger.js";

const logger = getLogger(import.meta.url);

/**
 * Joi validation middleware for Express.
 * Validates req.body, req.query, or req.params based on options.target.
 **/
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
      // Always get schema name from Joi meta, fallback to "default"
      const meta = schema?.$_terms?.metas?.find((m) => m.schemaName);
      const schemaName = meta?.schemaName || "default";

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

  const errors = {};

  for (const detail of error.details) {
    // Prefer context label, then path, else generic
    let field = detail.context?.label || detail.path?.[0];

    // If no field or error is general, assign to genericKey
    const isGeneric =
      !field ||
      (schema === "login" &&
        ["email", "password"].includes(field) &&
        detail.message === "Invalid email or password") ||
      detail.type === "any.base" ||
      detail.type === "any.custom";

    if (isGeneric) {
      field = genericKey;
    }

    // Only set first error per field
    if (!errors[field]) {
      errors[field] = detail.message;
    }
  }

  return errors;
}
