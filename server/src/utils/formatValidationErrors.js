// Utility to format Joi validation errors for frontend field mapping
// Each error is mapped to its field, or 'neutral' for general errors

export function formatValidationErrors(joiError) {
  if (!joiError || !Array.isArray(joiError.details)) return [];
  return joiError.details.map((detail) => {
    // If path is empty or not a string, treat as neutral/general error
    const field =
      Array.isArray(detail.path) &&
      detail.path.length > 0 &&
      typeof detail.path[0] === "string"
        ? detail.path[0]
        : "neutral";
    return {
      field,
      message: detail.message,
    };
  });
}
