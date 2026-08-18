const { logger } = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  logger.error(err);

  // Payload Too Large / Multer File Size limit
  if (
    err.status === 413 ||
    err.statusCode === 413 ||
    err.code === "LIMIT_FILE_SIZE" ||
    err.type === "entity.too.large"
  ) {
    return res.status(413).json({
      success: false,
      code: "FILE_TOO_LARGE",
      message: "One of the uploaded files exceeds the allowed size limit.",
    });
  }

  // Multer general upload errors
  if (err.name === "MulterError") {
    return res.status(400).json({
      success: false,
      code: "UPLOAD_ERROR",
      message: err.message || "File upload error occurred.",
    });
  }

  // Default error format
  let statusCode = 500;
  let message = "Internal Server Error";
  let errors = [];

  // Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Resource not found";
    errors = [{ field: err.path, message: "Invalid identifier format" }];
  }

  // Mongoose ValidationError
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation Error";
    errors = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message,
    }));
  }

  // Mongoose Duplicate Key (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({
      success: false,
      message: "Duplicate value",
      errors: [
        {
          field,
          message: `The ${field} is already taken.`,
        },
      ],
    });
  }

  // JWT Errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // Custom App Error
  if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length > 0 ? errors : undefined,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

module.exports = errorHandler;