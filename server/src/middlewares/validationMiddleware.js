import { getLogger } from "#utils/logger.js";
import { formatValidationErrors } from "../utils/formatValidationErrors.js";
const logger = getLogger(import.meta.url);

// Generic Joi validation middleware for Express
export function validateData(schema) {
  return (req, res, next) => {
    logger.debug("Validating request data");
    logger.debug(`Request body: ${JSON.stringify(req.body)}`);
    const { value, error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const formattedErrors = formatValidationErrors(error);
      logger.warn(
        `Validation error: ${formattedErrors
          .map((e) => `[${e.field}] ${e.message}`)
          .join(", ")}`
      );
      return res
        .status(400)
        .json({ message: "Validation error", errors: formattedErrors });
    }
    req.body = value;
    next();
  };
}
