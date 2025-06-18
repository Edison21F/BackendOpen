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
      if (encryptedData[field]) {
        encryptedData[field] = encrypt(encryptedData[field]);
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
      if (decryptedData[field]) {
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

  /**
   * Encrypt message content
   * @param {string} message - Message to encrypt
   * @returns {string} - Encrypted message
   */
  encryptMessage(message) {
    return encrypt(message);
  }

  /**
   * Decrypt message content
   * @param {string} encryptedMessage - Encrypted message
   * @returns {string} - Decrypted message
   */
  decryptMessage(encryptedMessage) {
    return decrypt(encryptedMessage);
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
      if (encryptedData[field]) {
        encryptedData[field] = encrypt(encryptedData[field]);
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
      if (decryptedData[field]) {
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
