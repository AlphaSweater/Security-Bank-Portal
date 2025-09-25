import { getLogger } from "#utils/logger.js";
const logger = getLogger(import.meta.url);

// Helper to format Joi errors for frontend
function formatValidationErrors(error) {
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

// Generic Joi validation middleware for Express
export function validateData(schema) {
  return (req, res, next) => {
    logger.debug("Validating request data");
    logger.debug(`Request body: ${JSON.stringify(req.body)}`);
    const { value, error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      logger.debug(`Validation error: ${JSON.stringify(error)}`);
      const formattedErrors = formatValidationErrors(error);
      logger.debug(
        `Formatted validation errors: ${JSON.stringify(formattedErrors)}`
      );
      return res
        .status(400)
        .json({ message: "Validation error", errors: formattedErrors });
    }
    req.body = value;
    next();
  };
}
