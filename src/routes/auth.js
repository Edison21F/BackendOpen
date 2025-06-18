const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, authRateLimit } = require('../middleware/auth');
const { 
  validateUserRegistration, 
  validateUserLogin, 
  validatePasswordChange 
} = require('../middleware/validation');
const { handleUserDataEncryption, removeSensitiveFields } = require('../middleware/encryption');
const { logUserActivity } = require('../middleware/logging');
const { asyncErrorWrapper } = require('../middleware/errorHandler');

// Apply rate limiting to all auth routes
router.use(authRateLimit);

// Remove sensitive fields from all responses
router.use(removeSensitiveFields(['password_hash', 'password']));

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', 
  validateUserRegistration,
  handleUserDataEncryption,
  logUserActivity('user_registration'),
  asyncErrorWrapper(authController.register)
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login',
  validateUserLogin,
  logUserActivity('user_login'),
  asyncErrorWrapper(authController.login)
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout',
  authenticateToken,
  logUserActivity('user_logout'),
  asyncErrorWrapper(authController.logout)
);

/**
 * @route   GET /api/auth/verify-token
 * @desc    Verify JWT token
 * @access  Public
 */
router.get('/verify-token',
  asyncErrorWrapper(authController.verifyToken)
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh JWT token
 * @access  Public
 */
router.post('/refresh-token',
  asyncErrorWrapper(authController.refreshToken)
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password',
  authenticateToken,
  validatePasswordChange,
  logUserActivity('password_change'),
  asyncErrorWrapper(authController.changePassword)
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile',
  authenticateToken,
  handleUserDataEncryption,
  asyncErrorWrapper(authController.getProfile)
);

/**
 * @route   DELETE /api/auth/deactivate
 * @desc    Deactivate user account
 * @access  Private
 */
router.delete('/deactivate',
  authenticateToken,
  logUserActivity('account_deactivation'),
  asyncErrorWrapper(authController.deactivateAccount)
);

module.exports = router;
