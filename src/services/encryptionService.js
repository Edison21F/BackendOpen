const { encrypt, decrypt, hashPassword, comparePassword } = require('../config/encryption');

class EncryptionService {
  /**
   * Encrypt sensitive user data
   * @param {Object} userData - User data object
   * @returns {Object} - User data with encrypted fields
   */
  encryptUserData(userData) {
    const encryptedData = { ...userData };
    
    // Fields that need encryption
    const fieldsToEncrypt = ['email', 'telefono', 'nombres', 'apellidos', 'fecha_nacimiento'];
    
    fieldsToEncrypt.forEach(field => {
      if (encryptedData[field] !== undefined && encryptedData[field] !== null) {
        try {
          encryptedData[field] = encrypt(encryptedData[field]);
        } catch (error) {
          console.error(`Error encrypting field ${field}:`, error);
          // Keep original value if encryption fails
        }
      }
    });
    
    return encryptedData;
  }

  /**
   * Decrypt sensitive user data
   * @param {Object} userData - User data object with encrypted fields
   * @returns {Object} - User data with decrypted fields
   */
  decryptUserData(userData) {
    if (!userData) return null;
    
    const decryptedData = { ...userData };
    
    // Fields that need decryption
    const fieldsToDecrypt = ['email', 'telefono', 'nombres', 'apellidos', 'fecha_nacimiento'];
    
    fieldsToDecrypt.forEach(field => {
      if (decryptedData[field] !== undefined && decryptedData[field] !== null) {
        try {
          decryptedData[field] = decrypt(decryptedData[field]);
        } catch (error) {
          console.error(`Error decrypting field ${field}:`, error);
          // Keep original value if decryption fails
          decryptedData[field] = null;
        }
      }
    });
    
    return decryptedData;
  }

  /**
   * Encrypt message content
   * @param {string} message - Message to encrypt
   * @returns {string} - Encrypted message
   */
  encryptMessage(message) {
    if (!message) return null;
    try {
      return encrypt(message);
    } catch (error) {
      console.error('Error encrypting message:', error);
      throw error;
    }
  }

  /**
   * Decrypt message content
   * @param {string} encryptedMessage - Encrypted message
   * @returns {string} - Decrypted message
   */
  decryptMessage(encryptedMessage) {
    if (!encryptedMessage) return null;
    try {
      return decrypt(encryptedMessage);
    } catch (error) {
      console.error('Error decrypting message:', error);
      throw error;
    }
  }

  /**
   * Hash password
   * @param {string} password - Plain text password
   * @returns {Promise<string>} - Hashed password
   */
  async hashPassword(password) {
    return await hashPassword(password);
  }

  /**
   * Compare password with hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} - True if passwords match
   */
  async comparePassword(password, hash) {
    return await comparePassword(password, hash);
  }

  /**
   * Encrypt sensitive data before storing
   * @param {Object} data - Data object
   * @param {Array} fields - Fields to encrypt
   * @returns {Object} - Data with encrypted fields
   */
  encryptFields(data, fields) {
    const encryptedData = { ...data };
    
    fields.forEach(field => {
      if (encryptedData[field] !== undefined && encryptedData[field] !== null) {
        try {
          // Convert to string if needed before encryption
          let valueToEncrypt = encryptedData[field];
          if (valueToEncrypt instanceof Date) {
            valueToEncrypt = valueToEncrypt.toISOString();
          } else if (typeof valueToEncrypt !== 'string') {
            valueToEncrypt = String(valueToEncrypt);
          }
          
          encryptedData[field] = encrypt(valueToEncrypt);
        } catch (error) {
          console.error(`Error encrypting field ${field}:`, error);
          // Keep original value if encryption fails
        }
      }
    });
    
    return encryptedData;
  }

  /**
   * Decrypt sensitive data after retrieval
   * @param {Object} data - Data object with encrypted fields
   * @param {Array} fields - Fields to decrypt
   * @returns {Object} - Data with decrypted fields
   */
  decryptFields(data, fields) {
    if (!data) return null;
    
    const decryptedData = { ...data };
    
    fields.forEach(field => {
      if (decryptedData[field] !== undefined && decryptedData[field] !== null) {
        try {
          decryptedData[field] = decrypt(decryptedData[field]);
        } catch (error) {
          console.error(`Error decrypting field ${field}:`, error);
          decryptedData[field] = null;
        }
      }
    });
    
    return decryptedData;
  }
}

module.exports = new EncryptionService();