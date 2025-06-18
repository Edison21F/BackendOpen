const authService = require('../services/authService');
const logService = require('../services/logService');

class AuthController {
  /**
   * Register a new user
   */
  async register(req, res) {
    try {
      const userData = req.body;
      const loginInfo = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        deviceInfo: req.get('X-Device-Info') || null
      };

      const result = await authService.register(userData);
      
      // Update login history for new user
      await authService.updateLoginHistory(result.user.id, loginInfo);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Login user
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const loginInfo = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        deviceInfo: req.get('X-Device-Info') || null
      };

      const result = await authService.login(email, password, loginInfo);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message || 'Login failed'
      });
    }
  }

  /**
   * Logout user (client-side token invalidation)
   */
  async logout(req, res) {
    try {
      const userId = req.user?.id;
      
      if (userId) {
        logService.logAuth('logout', { userId });
      }

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(req, res) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token is required'
        });
      }

      const decoded = await authService.verifyToken(token);
      const user = await authService.findUserById(decoded.userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: {
          user: {
            id: user.id,
            email: user.email,
            nombres: user.nombres,
            apellidos: user.apellidos,
            rol: user.rol,
            is_active: user.is_active
          },
          tokenInfo: {
            userId: decoded.userId,
            rol: decoded.rol,
            isActive: decoded.isActive
          }
        }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message || 'Invalid token'
      });
    }
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(req, res) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token is required'
        });
      }

      const newToken = await authService.refreshToken(token);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: newToken
        }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message || 'Token refresh failed'
      });
    }
  }

  /**
   * Change user password
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      await authService.changePassword(userId, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Password change failed'
      });
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await authService.findUserById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            nombres: user.nombres,
            apellidos: user.apellidos,
            telefono: user.telefono,
            fecha_nacimiento: user.fecha_nacimiento,
            rol: user.rol,
            is_active: user.is_active,
            created_at: user.created_at,
            updated_at: user.updated_at
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve profile'
      });
    }
  }

  /**
   * Deactivate user account
   */
  async deactivateAccount(req, res) {
    try {
      const userId = req.user.id;
      
      await authService.deactivateUser(userId);

      res.status(200).json({
        success: true,
        message: 'Account deactivated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Account deactivation failed'
      });
    }
  }
}

module.exports = new AuthController();
