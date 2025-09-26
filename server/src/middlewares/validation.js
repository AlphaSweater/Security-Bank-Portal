import { getLogger } from "#utils/logger.js";
const logger = getLogger(import.meta.url);

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

// Generic Joi validation middleware for Express
export function validateData(schema) {
  return (req, res, next) => {
    logger.debug("Validating request data");
    logger.debug(`Request body: ${JSON.stringify(req.body)}`);

    const { value, error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      logger.debug(`Validation error: ${JSON.stringify(error)}`);

      // Get schema name from .meta()
      const schemaName =
        schema.$_terms?.metas?.find((m) => m.schemaName)?.schemaName ||
        "default";

      const formattedErrors = formatJoiError(error, { schema: schemaName });

      logger.debug(
        `Formatted validation errors: ${JSON.stringify(formattedErrors)}`
      );

      return res
        .status(400)
        .json({ message: "Validation errors", errors: formattedErrors });
    }

    req.body = value; // clean validated data
    next();
  };
}
