class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

const notFoundHandler = (req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Multer errors (e.g. file too large, unexpected field) arrive without a statusCode.
  const isMulterError = err.name === "MulterError";
  const statusCode = err.statusCode || (isMulterError ? 400 : 500);
  const message = err.message || "Internal Server Error";

  if (statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    status: "error",
    message,
  });
};

module.exports = { AppError, notFoundHandler, errorHandler };
