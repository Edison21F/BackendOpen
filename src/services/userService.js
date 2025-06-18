const User = require('../models/sql/User');
const UserProfile = require('../models/nosql/UserProfile');
const encryptionService = require('./encryptionService');
const logService = require('./logService');
const { Op } = require('sequelize');

class UserService {
  /**
   * Get all users with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Users list with pagination info
   */
  async getAllUsers(options = {}) {
    try {
      const { page = 1, limit = 10, search, role, isActive } = options;
      const offset = (page - 1) * limit;

      const whereClause = {};
      
      if (role) {
        whereClause.rol = role;
      }
      
      if (typeof isActive === 'boolean') {
        whereClause.is_active = isActive;
      }

      const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [['created_at', 'DESC']],
        attributes: { exclude: ['password_hash'] }
      });

      // Decrypt user data
      const decryptedUsers = rows.map(user => 
        encryptionService.decryptUserData(user.toJSON())
      );

      // Filter by search term if provided (after decryption)
      let filteredUsers = decryptedUsers;
      if (search) {
        const searchTerm = search.toLowerCase();
        filteredUsers = decryptedUsers.filter(user => 
          (user.nombres && user.nombres.toLowerCase().includes(searchTerm)) ||
          (user.apellidos && user.apellidos.toLowerCase().includes(searchTerm)) ||
          (user.email && user.email.toLowerCase().includes(searchTerm))
        );
      }

      return {
        users: filteredUsers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      logService.error('Error getting all users:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - User data
   */
  async getUserById(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password_hash'] }
      });

      if (!user) {
        return null;
      }

      // Get user profile from MongoDB
      const profile = await UserProfile.findOne({ user_id: userId });

      const decryptedUser = encryptionService.decryptUserData(user.toJSON());
      
      return {
        ...decryptedUser,
        profile: profile || null
      };
    } catch (error) {
      logService.error('Error getting user by ID:', error);
      throw error;
    }
  }

  /**
   * Update user
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @param {string} updatedBy - ID of user making the update
   * @returns {Promise<Object>} - Updated user
   */
  async updateUser(userId, updateData, updatedBy) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Separate SQL and NoSQL updates
      const sqlUpdates = {};
      const profileUpdates = {};

      // Handle encrypted fields
      const encryptedFields = ['email', 'telefono', 'nombres', 'apellidos', 'fecha_nacimiento'];
      encryptedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          sqlUpdates[field] = updateData[field];
        }
      });

      // Handle other SQL fields
      if (updateData.rol !== undefined) sqlUpdates.rol = updateData.rol;
      if (updateData.is_active !== undefined) sqlUpdates.is_active = updateData.is_active;

      // Handle profile updates
      if (updateData.preferences) profileUpdates.preferences = updateData.preferences;
      if (updateData.accessibility_settings) profileUpdates.accessibility_settings = updateData.accessibility_settings;
      if (updateData.profile_image) profileUpdates.profile_image = updateData.profile_image;

      // Update SQL data
      if (Object.keys(sqlUpdates).length > 0) {
        const encryptedUpdates = encryptionService.encryptUserData(sqlUpdates);
        await user.update(encryptedUpdates);
      }

      // Update NoSQL profile
      if (Object.keys(profileUpdates).length > 0) {
        await UserProfile.findOneAndUpdate(
          { user_id: userId },
          { 
            $set: { 
              ...profileUpdates,
              updated_at: new Date()
            }
          },
          { upsert: true }
        );
      }

      logService.info('User updated', { userId, updatedBy, fields: Object.keys(updateData) });

      // Return updated user
      return await this.getUserById(userId);
    } catch (error) {
      logService.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete user (soft delete)
   * @param {string} userId - User ID
   * @param {string} deletedBy - ID of user performing deletion
   * @returns {Promise<boolean>} - Success status
   */
  async deleteUser(userId, deletedBy) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Soft delete by deactivating
      await user.update({ is_active: false });

      logService.info('User deleted (deactivated)', { userId, deletedBy });

      return true;
    } catch (error) {
      logService.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User profile
   */
  async getUserProfile(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password_hash'] }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const profile = await UserProfile.findOne({ user_id: userId });
      const decryptedUser = encryptionService.decryptUserData(user.toJSON());

      return {
        ...decryptedUser,
        profile: profile || {
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
        }
      };
    } catch (error) {
      logService.error('Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   * @param {string} userId - User ID
   * @param {Object} preferences - User preferences
   * @returns {Promise<Object>} - Updated profile
   */
  async updateUserPreferences(userId, preferences) {
    try {
      const updatedProfile = await UserProfile.findOneAndUpdate(
        { user_id: userId },
        { 
          $set: { 
            preferences,
            updated_at: new Date()
          }
        },
        { 
          new: true,
          upsert: true
        }
      );

      logService.info('User preferences updated', { userId, preferences });

      return updatedProfile;
    } catch (error) {
      logService.error('Error updating user preferences:', error);
      throw error;
    }
  }

  /**
   * Update accessibility settings
   * @param {string} userId - User ID
   * @param {Object} settings - Accessibility settings
   * @returns {Promise<Object>} - Updated profile
   */
  async updateAccessibilitySettings(userId, settings) {
    try {
      const updatedProfile = await UserProfile.findOneAndUpdate(
        { user_id: userId },
        { 
          $set: { 
            accessibility_settings: settings,
            updated_at: new Date()
          }
        },
        { 
          new: true,
          upsert: true
        }
      );

      logService.info('Accessibility settings updated', { userId, settings });

      return updatedProfile;
    } catch (error) {
      logService.error('Error updating accessibility settings:', error);
      throw error;
    }
  }

  /**
   * Add location to user history
   * @param {string} userId - User ID
   * @param {Object} location - Location data
   * @returns {Promise<boolean>} - Success status
   */
  async addLocationHistory(userId, location) {
    try {
      const { latitude, longitude, accuracy } = location;

      await UserProfile.findOneAndUpdate(
        { user_id: userId },
        {
          $push: {
            location_history: {
              latitude,
              longitude,
              accuracy,
              timestamp: new Date()
            }
          }
        },
        { upsert: true }
      );

      return true;
    } catch (error) {
      logService.error('Error adding location history:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User statistics
   */
  async getUserStatistics(userId) {
    try {
      const profile = await UserProfile.findOne({ user_id: userId });
      
      if (!profile) {
        return {
          login_count: 0,
          last_login: null,
          location_history_count: 0
        };
      }

      return {
        login_count: profile.login_history ? profile.login_history.length : 0,
        last_login: profile.last_login,
        location_history_count: profile.location_history ? profile.location_history.length : 0
      };
    } catch (error) {
      logService.error('Error getting user statistics:', error);
      throw error;
    }
  }

  /**
   * Search users
   * @param {string} searchTerm - Search term
   * @param {Object} options - Search options
   * @returns {Promise<Array>} - Found users
   */
  async searchUsers(searchTerm, options = {}) {
    try {
      const { limit = 10, role } = options;
      
      const whereClause = { is_active: true };
      if (role) {
        whereClause.rol = role;
      }

      const users = await User.findAll({
        where: whereClause,
        limit: parseInt(limit),
        attributes: { exclude: ['password_hash'] },
        order: [['created_at', 'DESC']]
      });

      // Decrypt and filter users
      const decryptedUsers = users.map(user => 
        encryptionService.decryptUserData(user.toJSON())
      );

      const searchTermLower = searchTerm.toLowerCase();
      const filteredUsers = decryptedUsers.filter(user => 
        (user.nombres && user.nombres.toLowerCase().includes(searchTermLower)) ||
        (user.apellidos && user.apellidos.toLowerCase().includes(searchTermLower)) ||
        (user.email && user.email.toLowerCase().includes(searchTermLower))
      );

      return filteredUsers.slice(0, limit);
    } catch (error) {
      logService.error('Error searching users:', error);
      throw error;
    }
  }
}

module.exports = new UserService();
