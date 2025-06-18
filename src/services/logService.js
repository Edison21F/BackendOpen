const winston = require('winston');
const path = require('path');
const config = require('../config/config');
const SystemLog = require('../models/nosql/SystemLog');

// Create logs directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync(config.logging.filePath)) {
  fs.mkdirSync(config.logging.filePath, { recursive: true });
}

// Configure Winston logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
      let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
      if (Object.keys(meta).length > 0) {
        logMessage += ` ${JSON.stringify(meta)}`;
      }
      return logMessage;
    })
  ),
  transports: [
    // File transport with daily rotation
    new winston.transports.File({
      filename: path.join(config.logging.filePath, config.logging.filename),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true
    }),
    // Console transport for development
    ...(config.server.nodeEnv === 'development' ? [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ] : [])
  ]
});

class LogService {
  /**
   * Log info message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  info(message, meta = {}) {
    logger.info(message, meta);
  }

  /**
   * Log warning message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    logger.warn(message, meta);
  }

  /**
   * Log error message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  error(message, meta = {}) {
    logger.error(message, meta);
  }

  /**
   * Log debug message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    logger.debug(message, meta);
  }

  /**
   * Log HTTP request
   * @param {Object} requestData - Request data
   */
  async logRequest(requestData) {
    const {
      method,
      url,
      statusCode,
      requestBody,
      responseBody,
      userId,
      ipAddress,
      userAgent,
      executionTime,
      error,
      headers,
      queryParams,
      routeParams,
      sessionId,
      correlationId
    } = requestData;

    // Determine log level based on status code
    let level = 'info';
    if (statusCode >= 400 && statusCode < 500) {
      level = 'warn';
    } else if (statusCode >= 500) {
      level = 'error';
    }

    // Log to file
    const logMessage = `${method} ${url} - ${statusCode} - ${executionTime}ms`;
    const logMeta = {
      method,
      url,
      statusCode,
      userId,
      ipAddress,
      executionTime,
      ...(error && { error: error.message })
    };

    logger.log(level, logMessage, logMeta);

    // Log to MongoDB
    try {
      const systemLog = new SystemLog({
        level,
        method,
        url,
        status_code: statusCode,
        request_body: requestBody,
        response_body: responseBody,
        user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent,
        execution_time: executionTime,
        error_details: error ? JSON.stringify({
          message: error.message,
          stack: error.stack,
          code: error.code,
          type: error.constructor.name
        }) : null,
        headers: headers || {},
        query_params: queryParams || {},
        route_params: routeParams || {},
        session_id: sessionId,
        correlation_id: correlationId
      });

      await systemLog.save();
    } catch (mongoError) {
      logger.error('Failed to save log to MongoDB:', mongoError);
    }
  }

  /**
   * Log authentication events
   * @param {string} event - Event type (login, logout, register, etc.)
   * @param {Object} data - Event data
   */
  async logAuth(event, data) {
    const message = `Auth event: ${event}`;
    this.info(message, { event, ...data });
  }

  /**
   * Log database operations
   * @param {string} operation - Database operation
   * @param {string} table - Table/Collection name
   * @param {Object} data - Operation data
   */
  async logDatabase(operation, table, data = {}) {
    const message = `Database ${operation} on ${table}`;
    this.debug(message, { operation, table, ...data });
  }

  /**
   * Log security events
   * @param {string} event - Security event type
   * @param {Object} data - Event data
   */
  async logSecurity(event, data) {
    const message = `Security event: ${event}`;
    this.warn(message, { event, ...data });
  }

  /**
   * Log performance metrics
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {Object} data - Additional data
   */
  async logPerformance(operation, duration, data = {}) {
    const message = `Performance: ${operation} took ${duration}ms`;
    this.info(message, { operation, duration, ...data });
  }

  /**
   * Get logs from file system
   * @param {Object} filters - Log filters
   * @returns {Array} - Log entries
   */
  async getFileLogs(filters = {}) {
    return new Promise((resolve, reject) => {
      const logFile = path.join(config.logging.filePath, config.logging.filename);
      
      fs.readFile(logFile, 'utf8', (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        const lines = data.split('\n').filter(line => line.trim());
        const logs = lines.map(line => {
          try {
            const match = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[(\w+)\]: (.+)$/);
            if (match) {
              return {
                timestamp: match[1],
                level: match[2].toLowerCase(),
                message: match[3]
              };
            }
          } catch (error) {
            return null;
          }
        }).filter(log => log !== null);

        resolve(logs);
      });
    });
  }

  /**
   * Get logs from MongoDB
   * @param {Object} filters - Log filters
   * @param {number} limit - Number of logs to return
   * @param {number} skip - Number of logs to skip
   * @returns {Array} - Log entries
   */
  async getDatabaseLogs(filters = {}, limit = 100, skip = 0) {
    try {
      const query = {};
      
      if (filters.level) {
        query.level = filters.level;
      }
      
      if (filters.user_id) {
        query.user_id = filters.user_id;
      }
      
      if (filters.status_code) {
        query.status_code = filters.status_code;
      }
      
      if (filters.method) {
        query.method = filters.method;
      }
      
      if (filters.start_date || filters.end_date) {
        query.timestamp = {};
        if (filters.start_date) {
          query.timestamp.$gte = new Date(filters.start_date);
        }
        if (filters.end_date) {
          query.timestamp.$lte = new Date(filters.end_date);
        }
      }

      const logs = await SystemLog.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      return logs;
    } catch (error) {
      this.error('Error retrieving database logs:', error);
      throw error;
    }
  }
}

module.exports = new LogService();
