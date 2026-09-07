const { AppError } = require("./errorHandler");

// Validates req.body against a Zod schema and replaces it with the parsed value.
const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const message = result.error.issues
      .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
      .join(", ");
    return next(new AppError(message, 400));
  }

  req.body = result.data;
  next();
};

// Validates req.query against a Zod schema and replaces it with the parsed value.
const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);

  if (!result.success) {
    const message = result.error.issues
      .map((issue) => `${issue.path.join(".") || "query"}: ${issue.message}`)
      .join(", ");
    return next(new AppError(message, 400));
  }

  req.query = result.data;
  next();
};

module.exports = { validateBody, validateQuery };
