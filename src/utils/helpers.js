const crypto = require('crypto');
const { REGEX, VALIDATION, GEOGRAPHIC } = require('./constants');

/**
 * Generate a random string of specified length
 * @param {number} length - Length of the random string
 * @returns {string} - Random string
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
};

/**
 * Generate a UUID v4
 * @returns {string} - UUID v4 string
 */
const generateUUID = () => {
  return crypto.randomUUID();
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return REGEX.EMAIL.test(email.toLowerCase());
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid phone
 */
const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  return REGEX.PHONE.test(phone);
};

/**
 * Validate UUID format
 * @param {string} uuid - UUID to validate
 * @returns {boolean} - True if valid UUID
 */
const isValidUUID = (uuid) => {
  if (!uuid || typeof uuid !== 'string') return false;
  return REGEX.UUID.test(uuid);
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid URL
 */
const isValidURL = (url) => {
  if (!url || typeof url !== 'string') return false;
  return REGEX.URL.test(url);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with isValid and issues
 */
const validatePasswordStrength = (password) => {
  const issues = [];
  
  if (!password || typeof password !== 'string') {
    return { isValid: false, issues: ['Password is required'] };
  }
  
  if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
    issues.push(`Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters long`);
  }
  
  if (!/[a-z]/.test(password)) {
    issues.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    issues.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    issues.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*]/.test(password)) {
    issues.push('Password must contain at least one special character (!@#$%^&*)');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

/**
 * Validate geographic coordinates
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Object} - Validation result
 */
const validateCoordinates = (latitude, longitude) => {
  const issues = [];
  
  if (typeof latitude !== 'number' || isNaN(latitude)) {
    issues.push('Latitude must be a valid number');
  } else if (latitude < GEOGRAPHIC.LATITUDE_MIN || latitude > GEOGRAPHIC.LATITUDE_MAX) {
    issues.push(`Latitude must be between ${GEOGRAPHIC.LATITUDE_MIN} and ${GEOGRAPHIC.LATITUDE_MAX}`);
  }
  
  if (typeof longitude !== 'number' || isNaN(longitude)) {
    issues.push('Longitude must be a valid number');
  } else if (longitude < GEOGRAPHIC.LONGITUDE_MIN || longitude > GEOGRAPHIC.LONGITUDE_MAX) {
    issues.push(`Longitude must be between ${GEOGRAPHIC.LONGITUDE_MIN} and ${GEOGRAPHIC.LONGITUDE_MAX}`);
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} - Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Sanitize string for database storage
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
};

/**
 * Format date for consistent display
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type ('iso', 'short', 'long')
 * @returns {string} - Formatted date string
 */
const formatDate = (date, format = 'iso') => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString();
    case 'long':
      return dateObj.toLocaleString();
    case 'iso':
    default:
      return dateObj.toISOString();
  }
};

/**
 * Parse pagination parameters
 * @param {Object} query - Query parameters
 * @returns {Object} - Parsed pagination object
 */
const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
};

/**
 * Build pagination response
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} totalItems - Total number of items
 * @returns {Object} - Pagination metadata
 */
const buildPaginationResponse = (page, limit, totalItems) => {
  const totalPages = Math.ceil(totalItems / limit);
  
  return {
    currentPage: page,
    totalPages,
    totalItems,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
};

/**
 * Sleep for specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after sleep
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} - Promise that resolves with function result
 */
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
};

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} - Cloned object
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }
  return obj;
};

/**
 * Remove undefined and null values from object
 * @param {Object} obj - Object to clean
 * @returns {Object} - Cleaned object
 */
const removeNullUndefined = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const cleaned = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== null && obj[key] !== undefined) {
      if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        cleaned[key] = removeNullUndefined(obj[key]);
      } else {
        cleaned[key] = obj[key];
      }
    }
  });
  
  return cleaned;
};

/**
 * Convert string to slug format
 * @param {string} str - String to convert
 * @returns {string} - Slug formatted string
 */
const slugify = (str) => {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Truncate string to specified length
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add when truncated
 * @returns {string} - Truncated string
 */
const truncateString = (str, maxLength = 100, suffix = '...') => {
  if (!str || typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Check if object is empty
 * @param {Object} obj - Object to check
 * @returns {boolean} - True if empty
 */
const isEmpty = (obj) => {
  if (obj === null || obj === undefined) return true;
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

/**
 * Generate correlation ID for request tracking
 * @returns {string} - Correlation ID
 */
const generateCorrelationId = () => {
  return `${Date.now()}-${generateRandomString(8)}`;
};

/**
 * Convert object keys to camelCase
 * @param {Object} obj - Object to convert
 * @returns {Object} - Object with camelCase keys
 */
const toCamelCase = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  
  const camelCased = {};
  Object.keys(obj).forEach(key => {
    const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    camelCased[camelKey] = obj[key];
  });
  
  return camelCased;
};

/**
 * Convert object keys to snake_case
 * @param {Object} obj - Object to convert
 * @returns {Object} - Object with snake_case keys
 */
const toSnakeCase = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  
  const snakeCased = {};
  Object.keys(obj).forEach(key => {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    snakeCased[snakeKey] = obj[key];
  });
  
  return snakeCased;
};

module.exports = {
  generateRandomString,
  generateUUID,
  isValidEmail,
  isValidPhone,
  isValidUUID,
  isValidURL,
  validatePasswordStrength,
  validateCoordinates,
  calculateDistance,
  sanitizeString,
  formatDate,
  parsePagination,
  buildPaginationResponse,
  sleep,
  retryWithBackoff,
  deepClone,
  removeNullUndefined,
  slugify,
  truncateString,
  isEmpty,
  generateCorrelationId,
  toCamelCase,
  toSnakeCase
};
