// Generic Joi validation middleware for Express
export function validateData(schema) {
  return (req, res, next) => {
    const { value, error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const details = error.details.map((d) => d.message);
      return res
        .status(400)
        .json({ message: "Validation error", errors: details });
    }
    req.body = value;
    next();
  };
}
