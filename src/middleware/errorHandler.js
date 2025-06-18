const logService = require('../services/logService');
const config = require('../config/config');

/**
 * Global error handler middleware
 * Handles all application errors
 */
const errorHandler = (error, req, res, next) => {
  // Log the error
  logService.error('Global error handler', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    correlationId: req.correlationId
  });

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';
  let details = null;

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    details = error.details || error.message;
  } else if (error.name === 'UnauthorizedError' || error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Not found';
  } else if (error.name === 'ConflictError') {
    statusCode = 409;
    message = 'Conflict';
  } else if (error.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Database validation error';
    details = error.errors?.map(err => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));
  } else if (error.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Duplicate entry';
    details = error.errors?.map(err => ({
      field: err.path,
      message: `${err.path} already exists`,
      value: err.value
    }));
  } else if (error.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = 'Invalid reference';
    details = 'Referenced record does not exist';
  } else if (error.name === 'SequelizeDatabaseError') {
    statusCode = 500;
    message = 'Database error';
    details = config.server.nodeEnv === 'development' ? error.message : 'Database operation failed';
  } else if (error.name === 'MongoError' || error.name === 'MongooseError') {
    statusCode = 500;
    message = 'Database error';
    details = config.server.nodeEnv === 'development' ? error.message : 'Database operation failed';
  } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Service unavailable';
    details = 'External service is not available';
  } else if (error.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'File too large';
    details = 'Uploaded file exceeds size limit';
  } else if (error.code === 'EBADCSRFTOKEN') {
    statusCode = 403;
    message = 'Invalid CSRF token';
  } else if (error.code === 'ETIMEOUT') {
    statusCode = 408;
    message = 'Request timeout';
  } else if (error.statusCode) {
    statusCode = error.statusCode;
    message = error.message || message;
  }

  // Build error response
  const errorResponse = {
    success: false,
    message,
    error: {
      type: error.name || 'Error',
      code: error.code || 'UNKNOWN_ERROR',
      correlationId: req.correlationId
    }
  };

  // Add details in development mode or for validation errors
  if (details && (config.server.nodeEnv === 'development' || statusCode === 400)) {
    errorResponse.error.details = details;
  }

  // Add stack trace in development mode
  if (config.server.nodeEnv === 'development') {
    errorResponse.error.stack = error.stack;
  }

  // Add timestamp
  errorResponse.error.timestamp = new Date().toISOString();

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 handler for routes that don't exist
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route ${req.method} ${req.originalUrl} not found`);
  error.name = 'NotFoundError';
  error.statusCode = 404;
  
  logService.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    correlationId: req.correlationId
  });
  
  next(error);
};

/**
 * Async error wrapper
 * Catches errors in async route handlers
 */
const asyncErrorWrapper = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Rate limit error handler
 */
const rateLimitHandler = (req, res, next) => {
  logService.logSecurity('rate_limit_exceeded', {
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    url: req.originalUrl,
    userId: req.user?.id,
    correlationId: req.correlationId
  });

  res.status(429).json({
    success: false,
    message: 'Too many requests',
    error: {
      type: 'RateLimitError',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: req.rateLimit?.resetTime || null,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Validation error formatter
 */
const formatValidationError = (error) => {
  if (error.name === 'ValidationError' && error.details) {
    return {
      name: 'ValidationError',
      message: 'Validation failed',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }))
    };
  }
  return error;
};

/**
 * Database error formatter
 */
const formatDatabaseError = (error) => {
  if (error.name === 'SequelizeValidationError') {
    return {
      name: 'ValidationError',
      message: 'Database validation failed',
      details: error.errors.map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }))
    };
  }
  
  if (error.name === 'SequelizeUniqueConstraintError') {
    return {
      name: 'ConflictError',
      message: 'Duplicate entry',
      details: error.errors.map(err => ({
        field: err.path,
        message: `${err.path} already exists`
      }))
    };
  }
  
  return error;
};

/**
 * CORS error handler
 */
const corsErrorHandler = (error, req, res, next) => {
  if (error.message && error.message.includes('CORS')) {
    logService.logSecurity('cors_error', {
      origin: req.get('Origin'),
      method: req.method,
      url: req.originalUrl,
      ipAddress: req.ip,
      correlationId: req.correlationId
    });

    return res.status(403).json({
      success: false,
      message: 'CORS policy violation',
      error: {
        type: 'CORSError',
        code: 'CORS_POLICY_VIOLATION',
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  next(error);
};

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = (signal) => {
  logService.info(`Received ${signal}, shutting down gracefully...`);
  
  // Close database connections
  const databaseService = require('../services/databaseService');
  databaseService.closeConnections()
    .then(() => {
      logService.info('Database connections closed');
      process.exit(0);
    })
    .catch((error) => {
      logService.error('Error closing database connections:', error);
      process.exit(1);
    });
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncErrorWrapper,
  rateLimitHandler,
  formatValidationError,
  formatDatabaseError,
  corsErrorHandler,
  gracefulShutdown
};
