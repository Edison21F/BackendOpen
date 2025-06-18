const logService = require('../services/logService');
const { v4: uuidv4 } = require('uuid');

/**
 * Request logging middleware
 * Logs all HTTP requests and responses
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const correlationId = uuidv4();
  
  // Add correlation ID to request
  req.correlationId = correlationId;
  
  // Store original res.json method
  const originalJson = res.json;
  let responseBody = null;
  
  // Override res.json to capture response body
  res.json = function(data) {
    responseBody = data;
    return originalJson.call(this, data);
  };
  
  // Store original res.end method
  const originalEnd = res.end;
  
  // Override res.end to log the request
  res.end = function(chunk, encoding) {
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    // Prepare request data for logging
    const requestData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      requestBody: sanitizeRequestBody(req.body),
      responseBody: sanitizeResponseBody(responseBody),
      userId: req.user?.id || null,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      executionTime,
      headers: sanitizeHeaders(req.headers),
      queryParams: req.query,
      routeParams: req.params,
      sessionId: req.sessionID || null,
      correlationId
    };
    
    // Add error details if response indicates an error
    if (res.statusCode >= 400) {
      requestData.error = {
        statusCode: res.statusCode,
        message: responseBody?.message || 'Unknown error',
        stack: responseBody?.stack || null
      };
    }
    
    // Log the request asynchronously
    setImmediate(async () => {
      try {
        await logService.logRequest(requestData);
      } catch (error) {
        console.error('Failed to log request:', error);
      }
    });
    
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Performance monitoring middleware
 * Logs slow requests
 */
const performanceLogger = (threshold = 1000) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const executionTime = Date.now() - startTime;
      
      if (executionTime > threshold) {
        logService.warn('Slow request detected', {
          method: req.method,
          url: req.originalUrl,
          executionTime,
          threshold,
          userId: req.user?.id,
          correlationId: req.correlationId
        });
      }
    });
    
    next();
  };
};

/**
 * Error logging middleware
 * Logs application errors
 */
const errorLogger = (error, req, res, next) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    correlationId: req.correlationId,
    requestBody: sanitizeRequestBody(req.body),
    queryParams: req.query,
    routeParams: req.params
  };
  
  logService.error('Application error', errorData);
  
  next(error);
};

/**
 * Security event logging middleware
 * Logs security-related events
 */
const securityLogger = (eventType) => {
  return (req, res, next) => {
    const securityData = {
      eventType,
      method: req.method,
      url: req.originalUrl,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };
    
    logService.logSecurity(eventType, securityData);
    
    next();
  };
};

/**
 * Database operation logging middleware
 * Logs database operations
 */
const databaseLogger = (operation, table) => {
  return (req, res, next) => {
    const dbData = {
      operation,
      table,
      userId: req.user?.id,
      correlationId: req.correlationId,
      requestData: sanitizeRequestBody(req.body)
    };
    
    logService.logDatabase(operation, table, dbData);
    
    next();
  };
};

/**
 * Sanitize request body for logging
 * Removes sensitive information
 */
const sanitizeRequestBody = (body) => {
  if (!body || typeof body !== 'object') return body;
  
  const sensitiveFields = [
    'password', 'password_hash', 'currentPassword', 'newPassword',
    'token', 'access_token', 'refresh_token', 'secret', 'key',
    'authorization', 'auth'
  ];
  
  const sanitized = { ...body };
  
  Object.keys(sanitized).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeRequestBody(sanitized[key]);
    }
  });
  
  return sanitized;
};

/**
 * Sanitize response body for logging
 * Removes sensitive information
 */
const sanitizeResponseBody = (body) => {
  if (!body || typeof body !== 'object') return body;
  
  const sensitiveFields = [
    'password', 'password_hash', 'token', 'access_token', 'refresh_token',
    'secret', 'key', 'authorization', 'auth'
  ];
  
  const sanitized = { ...body };
  
  // Remove sensitive fields from response
  Object.keys(sanitized).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeResponseBody(sanitized[key]);
    }
  });
  
  return sanitized;
};

/**
 * Sanitize headers for logging
 * Removes sensitive headers
 */
const sanitizeHeaders = (headers) => {
  if (!headers || typeof headers !== 'object') return headers;
  
  const sensitiveHeaders = [
    'authorization', 'cookie', 'x-auth-token', 'x-api-key',
    'authentication', 'proxy-authorization'
  ];
  
  const sanitized = { ...headers };
  
  Object.keys(sanitized).forEach(key => {
    if (sensitiveHeaders.some(header => key.toLowerCase().includes(header))) {
      sanitized[key] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

/**
 * Log user activity
 */
const logUserActivity = (activity) => {
  return (req, res, next) => {
    if (req.user) {
      logService.info(`User activity: ${activity}`, {
        userId: req.user.id,
        userRole: req.user.rol,
        activity,
        method: req.method,
        url: req.originalUrl,
        ipAddress: req.ip,
        correlationId: req.correlationId
      });
    }
    
    next();
  };
};

/**
 * Log API usage
 */
const logApiUsage = (req, res, next) => {
  logService.info('API usage', {
    endpoint: req.originalUrl,
    method: req.method,
    userId: req.user?.id,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    correlationId: req.correlationId
  });
  
  next();
};

module.exports = {
  requestLogger,
  performanceLogger,
  errorLogger,
  securityLogger,
  databaseLogger,
  logUserActivity,
  logApiUsage,
  sanitizeRequestBody,
  sanitizeResponseBody,
  sanitizeHeaders
};
