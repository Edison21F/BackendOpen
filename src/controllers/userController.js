const userService = require('../services/userService');
const logService = require('../services/logService');

class UserController {
  /**
   * Get all users with pagination and filtering
   */
  async getAllUsers(req, res) {
    try {
      const options = req.query;
      const result = await userService.getAllUsers(options);

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: result
      });
    } catch (error) {
      logService.error('Error in getAllUsers:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve users'
      });
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: { user }
      });
    } catch (error) {
      logService.error('Error in getUserById:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve user'
      });
    }
  }

  /**
   * Update user
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = req.user.id;

      // Check if user exists
      const existingUser = await userService.getUserById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check authorization: users can only update their own profile, admins can update any
      if (req.user.rol !== 'admin' && req.user.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to update this user'
        });
      }

      const updatedUser = await userService.updateUser(id, updateData, updatedBy);

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: { user: updatedUser }
      });
    } catch (error) {
      logService.error('Error in updateUser:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update user'
      });
    }
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const deletedBy = req.user.id;

      // Check if user exists
      const existingUser = await userService.getUserById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Only admins can delete users
      if (req.user.rol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin privileges required to delete users'
        });
      }

      // Prevent self-deletion
      if (req.user.id === id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }

      await userService.deleteUser(id, deletedBy);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      logService.error('Error in deleteUser:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete user'
      });
    }
  }

  /**
   * Get user profile with extended information
   */
  async getUserProfile(req, res) {
    try {
      const { id } = req.params;
      
      // Check authorization
      if (req.user.rol !== 'admin' && req.user.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to view this profile'
        });
      }

      const profile = await userService.getUserProfile(id);

      res.status(200).json({
        success: true,
        message: 'User profile retrieved successfully',
        data: { profile }
      });
    } catch (error) {
      logService.error('Error in getUserProfile:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve user profile'
      });
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(req, res) {
    try {
      const { id } = req.params;
      const { preferences } = req.body;

      // Check authorization
      if (req.user.rol !== 'admin' && req.user.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to update preferences'
        });
      }

      const updatedProfile = await userService.updateUserPreferences(id, preferences);

      res.status(200).json({
        success: true,
        message: 'User preferences updated successfully',
        data: { profile: updatedProfile }
      });
    } catch (error) {
      logService.error('Error in updateUserPreferences:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update user preferences'
      });
    }
  }

  /**
   * Update accessibility settings
   */
  async updateAccessibilitySettings(req, res) {
    try {
      const { id } = req.params;
      const { accessibility_settings } = req.body;

      // Check authorization
      if (req.user.rol !== 'admin' && req.user.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to update accessibility settings'
        });
      }

      const updatedProfile = await userService.updateAccessibilitySettings(id, accessibility_settings);

      res.status(200).json({
        success: true,
        message: 'Accessibility settings updated successfully',
        data: { profile: updatedProfile }
      });
    } catch (error) {
      logService.error('Error in updateAccessibilitySettings:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update accessibility settings'
      });
    }
  }

  /**
   * Add location to user history
   */
  async addLocationHistory(req, res) {
    try {
      const { id } = req.params;
      const locationData = req.body;

      // Check authorization
      if (req.user.rol !== 'admin' && req.user.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to add location history'
        });
      }

      await userService.addLocationHistory(id, locationData);

      res.status(201).json({
        success: true,
        message: 'Location added to history successfully'
      });
    } catch (error) {
      logService.error('Error in addLocationHistory:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to add location history'
      });
    }
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(req, res) {
    try {
      const { id } = req.params;

      // Check authorization
      if (req.user.rol !== 'admin' && req.user.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to view statistics'
        });
      }

      const statistics = await userService.getUserStatistics(id);

      res.status(200).json({
        success: true,
        message: 'User statistics retrieved successfully',
        data: { statistics }
      });
    } catch (error) {
      logService.error('Error in getUserStatistics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve user statistics'
      });
    }
  }

  /**
   * Search users
   */
  async searchUsers(req, res) {
    try {
      const { q: searchTerm, ...options } = req.query;

      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search term must be at least 2 characters long'
        });
      }

      const users = await userService.searchUsers(searchTerm.trim(), options);

      res.status(200).json({
        success: true,
        message: 'Users search completed successfully',
        data: { users }
      });
    } catch (error) {
      logService.error('Error in searchUsers:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to search users'
      });
    }
  }
}

module.exports = new UserController();
