const crypto = require('crypto');
const config = require('./config');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const KEY_LENGTH = 32;
const ENCRYPTION_KEY = config.security.encryptionKey;

/**
 * Modern encryption using crypto.createCipheriv (Node.js 18+ compatible)
 * @param {string|Date|number} data - The data to encrypt
 * @returns {string} - The encrypted text in format: iv:encrypted
 */
const encrypt = (data) => {
  if (!data) return null;
  
  try {
    // Convert data to string if it's not already
    let text;
    if (typeof data === 'string') {
      text = data;
    } else if (data instanceof Date) {
      text = data.toISOString();
    } else if (typeof data === 'number') {
      text = data.toString();
    } else {
      text = String(data);
    }
    
    // Create a consistent key from the encryption key
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', KEY_LENGTH);
    
    // Generate a random IV
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV and encrypted data
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Modern decryption using crypto.createDecipheriv (Node.js 18+ compatible)
 * @param {string} encryptedData - The encrypted data in format: iv:encrypted
 * @returns {string} - The decrypted text
 */
const decrypt = (encryptedData) => {
  if (!encryptedData) return null;
  
  try {
    // Split IV and encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    // Create a consistent key from the encryption key
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', KEY_LENGTH);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    // Decrypt the text
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Hash a password using bcrypt
 * @param {string} password - The password to hash
 * @returns {Promise<string>} - The hashed password
 */
const hashPassword = async (password) => {
  const bcrypt = require('bcrypt');
  return await bcrypt.hash(password, config.security.bcryptRounds);
};

/**
 * Compare a password with its hash
 * @param {string} password - The plain password
 * @param {string} hash - The hashed password
 * @returns {Promise<boolean>} - True if passwords match
 */
const comparePassword = async (password, hash) => {
  const bcrypt = require('bcrypt');
  return await bcrypt.compare(password, hash);
};

module.exports = {
  encrypt,
  decrypt,
  hashPassword,
  comparePassword
};