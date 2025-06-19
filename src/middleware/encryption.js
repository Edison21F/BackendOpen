// src/middleware/encryption.js - Versión Simplificada y Corregida

const encryptionService = require('../services/encryptionService');
const logService = require('../services/logService');

/**
 * Middleware para manejar encriptación/desencriptación de datos de usuario
 * Se aplica solo en rutas específicas, no globalmente
 */
const handleUserDataEncryption = (req, res, next) => {
  try {
    // Encriptar datos de entrada si existen
    if (req.body && Object.keys(req.body).length > 0) {
      const userFields = ['email', 'telefono', 'nombres', 'apellidos', 'fecha_nacimiento'];
      const fieldsToEncrypt = userFields.filter(field => req.body[field] !== undefined);
      
      if (fieldsToEncrypt.length > 0) {
        // Debug log
        logService.debug('Encrypting user fields:', { fields: fieldsToEncrypt, userId: req.user?.id });
        
        const encryptedData = encryptionService.encryptFields(req.body, fieldsToEncrypt);
        req.body = { ...req.body, ...encryptedData };
      }
    }
    
    // Interceptar respuesta para desencriptar
    const originalJson = res.json;
    res.json = function(data) {
      try {
        if (data && typeof data === 'object') {
          // Manejar objeto user único
          if (data.user) {
            logService.debug('Decrypting user data in response', { userId: data.user.id });
            data.user = encryptionService.decryptUserData(data.user);
          }
          
          // Manejar array de usuarios
          if (data.users && Array.isArray(data.users)) {
            logService.debug('Decrypting users array', { count: data.users.length });
            data.users = data.users.map(user => encryptionService.decryptUserData(user));
          }
          
          // Manejar datos dentro de data.data
          if (data.data) {
            if (data.data.user) {
              data.data.user = encryptionService.decryptUserData(data.data.user);
            }
            if (data.data.users && Array.isArray(data.data.users)) {
              data.data.users = data.data.users.map(user => encryptionService.decryptUserData(user));
            }
          }
        }
      } catch (error) {
        logService.error('Error decrypting user data in response:', error);
        // Continuar con datos originales si falla la desencriptación
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  } catch (error) {
    logService.error('User data encryption middleware failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Data processing error'
    });
  }
};

/**
 * Middleware para manejar encriptación/desencriptación de mensajes
 */
const handleMessageEncryption = (req, res, next) => {
  try {
    // Encriptar mensaje en request si existe
    if (req.body && req.body.message) {
      logService.debug('Encrypting message', { userId: req.user?.id });
      // No encriptar aquí - se hace en el controller para evitar doble encriptación
    }
    
    // Interceptar respuesta para desencriptar mensajes
    const originalJson = res.json;
    res.json = function(data) {
      try {
        if (data && typeof data === 'object') {
          // Manejar mensaje único
          if (data.message && typeof data.message === 'object' && data.message.message) {
            data.message.message = encryptionService.decryptMessage(data.message.message);
          }
          
          // Manejar array de mensajes
          if (data.messages && Array.isArray(data.messages)) {
            data.messages = data.messages.map(msg => ({
              ...msg,
              message: encryptionService.decryptMessage(msg.message)
            }));
          }
          
          // Manejar datos dentro de data.data
          if (data.data) {
            if (data.data.message && data.data.message.message) {
              data.data.message.message = encryptionService.decryptMessage(data.data.message.message);
            }
            if (data.data.messages && Array.isArray(data.data.messages)) {
              data.data.messages = data.data.messages.map(msg => ({
                ...msg,
                message: encryptionService.decryptMessage(msg.message)
              }));
            }
          }
        }
      } catch (error) {
        logService.error('Error decrypting message data in response:', error);
        // Continuar con datos originales si falla la desencriptación
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  } catch (error) {
    logService.error('Message encryption middleware failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Data processing error'
    });
  }
};

/**
 * Middleware para remover campos sensibles de las respuestas
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
 * Recursivamente remover campos sensibles
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
  handleUserDataEncryption,
  handleMessageEncryption,
  removeSensitiveFields
};