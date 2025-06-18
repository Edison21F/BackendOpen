const jwt = require('jsonwebtoken');
const { User } = require('../models');
const encryptionService = require('./encryptionService');
const logService = require('./logService');
const config = require('../config/config');

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - Created user and token
   */
  async register(userData) {
    try {
      const { email, password, telefono, nombres, apellidos, fecha_nacimiento, rol = 'user' } = userData;

      // Check if user already exists
      const existingUser = await this.findUserByEmail(email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Hash password
      const hashedPassword = await encryptionService.hashPassword(password);

      // Encrypt sensitive data
      const encryptedUserData = encryptionService.encryptUserData({
        email,
        telefono,
        nombres,
        apellidos,
        fecha_nacimiento
      });

      // Create user in PostgreSQL
      const user = await User.create({
        ...encryptedUserData,
        password_hash: hashedPassword,
        rol,
        is_active: true
      });

      // Create user profile in MongoDB
      await UserProfile.create({
        user_id: user.id,
        preferences: {
          language: 'es',
          voice_speed: 1.0,
          voice_type: 'female',
          notifications_enabled: true,
          location_sharing: false
        },
        accessibility_settings: {
          high_contrast: false,
          large_text: false,
          voice_guidance: true,
          vibration_feedback: true
        }
      });

      // Generate JWT token
      const token = this.generateToken(user);

      // Decrypt user data for response
      const decryptedUser = encryptionService.decryptUserData(user.toJSON());
      delete decryptedUser.password_hash;

      logService.logAuth('register', { userId: user.id, email: decryptedUser.email });

      return {
        user: decryptedUser,
        token
      };
    } catch (error) {
      logService.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} loginInfo - Additional login information
   * @returns {Promise<Object>} - User and token
   */
  async login(email, password, loginInfo = {}) {
    try {
      // Find user by email
      const user = await this.findUserByEmail(email);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if user is active
      if (!user.is_active) {
        throw new Error('User account is deactivated');
      }

      // Verify password
      const isValidPassword = await encryptionService.comparePassword(password, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      // Update user profile with login information
      await this.updateLoginHistory(user.id, loginInfo);

      // Generate JWT token
      const token = this.generateToken(user);

      // Decrypt user data for response
      const decryptedUser = encryptionService.decryptUserData(user.toJSON());
      delete decryptedUser.password_hash;

      logService.logAuth('login', { 
        userId: user.id, 
        email: decryptedUser.email,
        ipAddress: loginInfo.ipAddress 
      });

      return {
        user: decryptedUser,
        token
      };
    } catch (error) {
      logService.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} - User or null
   */
  async findUserByEmail(email) {
    try {
      // Encrypt email for search
      const encryptedEmail = encryptionService.encryptFields({ email }, ['email']).email;
      
      const user = await User.findOne({
        where: { email: encryptedEmail }
      });

      return user;
    } catch (error) {
      logService.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - User or null
   */
  async findUserById(userId) {
    try {
      const user = await User.findByPk(userId);
      if (user) {
        return encryptionService.decryptUserData(user.toJSON());
      }
      return null;
    } catch (error) {
      logService.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Generate JWT token
   * @param {Object} user - User object
   * @returns {string} - JWT token
   */
  generateToken(user) {
    const payload = {
      userId: user.id,
      rol: user.rol,
      isActive: user.is_active
    };

    return jwt.sign(payload, config.security.jwtSecret, {
      expiresIn: config.security.jwtExpiresIn
    });
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Promise<Object>} - Decoded token payload
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, config.security.jwtSecret);
      
      // Check if user still exists and is active
      const user = await User.findByPk(decoded.userId);
      if (!user || !user.is_active) {
        throw new Error('Invalid token or user not found');
      }

      return decoded;
    } catch (error) {
      logService.error('Token verification failed:', error);
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Update user login history
   * @param {string} userId - User ID
   * @param {Object} loginInfo - Login information
   */
  async updateLoginHistory(userId, loginInfo) {
    try {
      const { ipAddress, userAgent, deviceInfo } = loginInfo;

      await UserProfile.findOneAndUpdate(
        { user_id: userId },
        {
          $set: {
            last_login: new Date(),
            updated_at: new Date()
          },
          $push: {
            login_history: {
              timestamp: new Date(),
              ip_address: ipAddress,
              user_agent: userAgent,
              device_info: deviceInfo
            }
          }
        },
        { upsert: true }
      );
    } catch (error) {
      logService.error('Error updating login history:', error);
      // Don't throw error as this is not critical for login process
    }
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} - Success status
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isValidPassword = await encryptionService.comparePassword(currentPassword, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await encryptionService.hashPassword(newPassword);

      // Update password
      await user.update({ password_hash: hashedNewPassword });

      logService.logAuth('password_change', { userId });

      return true;
    } catch (error) {
      logService.error('Password change failed:', error);
      throw error;
    }
  }

  /**
   * Deactivate user account
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Success status
   */
  async deactivateUser(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await user.update({ is_active: false });

      logService.logAuth('deactivate', { userId });

      return true;
    } catch (error) {
      logService.error('User deactivation failed:', error);
      throw error;
    }
  }

  /**
   * Refresh JWT token
   * @param {string} token - Current JWT token
   * @returns {Promise<string>} - New JWT token
   */
  async refreshToken(token) {
    try {
      const decoded = await this.verifyToken(token);
      const user = await User.findByPk(decoded.userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      return this.generateToken(user);
    } catch (error) {
      logService.error('Token refresh failed:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();
