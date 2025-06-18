const encryptionService = require('../services/encryptionService');
const logService = require('../services/logService');

/**
 * Middleware to encrypt sensitive request data
 * @param {Array} fields - Fields to encrypt
 */
const encryptRequestData = (fields = []) => {
  return (req, res, next) => {
    try {
      if (req.body && Object.keys(req.body).length > 0) {
        const encryptedBody = encryptionService.encryptFields(req.body, fields);
        req.body = encryptedBody;
      }
      next();
    } catch (error) {
      logService.error('Request data encryption failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Data processing error'
      });
    }
  };
};

/**
 * Middleware to decrypt sensitive response data
 * @param {Array} fields - Fields to decrypt
 */
const decryptResponseData = (fields = []) => {
  return (req, res, next) => {
    // Store original json method
    const originalJson = res.json;
    
    // Override json method
    res.json = function(data) {
      try {
        if (data && typeof data === 'object') {
          // Handle single object
          if (data.user || data.users) {
            if (data.user) {
              data.user = encryptionService.decryptFields(data.user, fields);
            }
            if (data.users && Array.isArray(data.users)) {
              data.users = data.users.map(user => 
                encryptionService.decryptFields(user, fields)
              );
            }
          }
          // Handle direct data decryption
          else if (fields.some(field => data[field])) {
            data = encryptionService.decryptFields(data, fields);
          }
        }
      } catch (error) {
        logService.error('Response data decryption failed:', error);
        // Continue with original data if decryption fails
      }
      
      // Call original json method
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Middleware to handle user data encryption/decryption
 */
const handleUserDataEncryption = (req, res, next) => {
  const userFields = ['email', 'telefono', 'nombres', 'apellidos', 'fecha_nacimiento'];
  
  try {
    // Encrypt request data
    if (req.body && Object.keys(req.body).length > 0) {
      const fieldsToEncrypt = userFields.filter(field => req.body[field] !== undefined);
      if (fieldsToEncrypt.length > 0) {
        req.body = encryptionService.encryptFields(req.body, fieldsToEncrypt);
      }
    }
    
    // Store original json method for response decryption
    const originalJson = res.json;
    res.json = function(data) {
      try {
        if (data && typeof data === 'object') {
          // Handle user object
          if (data.user) {
            data.user = encryptionService.decryptUserData(data.user);
          }
          // Handle users array
          if (data.users && Array.isArray(data.users)) {
            data.users = data.users.map(user => 
              encryptionService.decryptUserData(user)
            );
          }
          // Handle direct user data
          else if (userFields.some(field => data[field])) {
            data = encryptionService.decryptUserData(data);
          }
        }
      } catch (error) {
        logService.error('User data decryption failed:', error);
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  } catch (error) {
    logService.error('User data encryption failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Data processing error'
    });
  }
};

/**
 * Middleware to handle message encryption/decryption
 */
const handleMessageEncryption = (req, res, next) => {
  try {
    // Encrypt message in request
    if (req.body && req.body.message) {
      req.body.message = encryptionService.encryptMessage(req.body.message);
    }
    
    // Store original json method for response decryption
    const originalJson = res.json;
    res.json = function(data) {
      try {
        if (data && typeof data === 'object') {
          // Handle single message
          if (data.message && typeof data.message === 'string') {
            data.message = encryptionService.decryptMessage(data.message);
          }
          // Handle messages array
          if (data.messages && Array.isArray(data.messages)) {
            data.messages = data.messages.map(msg => ({
              ...msg,
              message: encryptionService.decryptMessage(msg.message)
            }));
          }
          // Handle message object
          if (data.message && typeof data.message === 'object' && data.message.message) {
            data.message.message = encryptionService.decryptMessage(data.message.message);
          }
        }
      } catch (error) {
        logService.error('Message decryption failed:', error);
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  } catch (error) {
    logService.error('Message encryption failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Data processing error'
    });
  }
};

/**
 * Middleware to sanitize sensitive data from logs
 */
const sanitizeLoggableData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = ['password', 'password_hash', 'token', 'secret', 'key'];
  const sanitized = { ...data };
  
  Object.keys(sanitized).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeLoggableData(sanitized[key]);
    }
  });
  
  return sanitized;
};

/**
 * Middleware to remove sensitive fields from responses
 */
const removeSensitiveFields = (fieldsToRemove = ['password_hash', 'password']) => {
  return (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
      try {
        if (data && typeof data === 'object') {
          const cleanData = removeSensitiveFieldsRecursive(data, fieldsToRemove);
          return originalJson.call(this, cleanData);
        }
      } catch (error) {
        logService.error('Failed to remove sensitive fields:', error);
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Recursively remove sensitive fields from object
 */
const removeSensitiveFieldsRecursive = (obj, fieldsToRemove) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => removeSensitiveFieldsRecursive(item, fieldsToRemove));
  }
  
  const cleaned = {};
  Object.keys(obj).forEach(key => {
    if (!fieldsToRemove.includes(key)) {
      if (typeof obj[key] === 'object') {
        cleaned[key] = removeSensitiveFieldsRecursive(obj[key], fieldsToRemove);
      } else {
        cleaned[key] = obj[key];
      }
    }
  });
  
  return cleaned;
};

module.exports = {
  encryptRequestData,
  decryptResponseData,
  handleUserDataEncryption,
  handleMessageEncryption,
  sanitizeLoggableData,
  removeSensitiveFields
};
