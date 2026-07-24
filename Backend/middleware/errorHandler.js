const { logger } = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  logger.error(err);

  // Default error format
  let statusCode = 500;
  let message = "Internal Server Error";
  let errors = [];

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Resource not found';
    errors = [{ field: err.path, message: 'Invalid identifier format' }];
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message
    }));
  }

  // Mongoose Duplicate Key (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
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
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
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
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

module.exports = errorHandler;