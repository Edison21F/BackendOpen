const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireAdmin, requireOwnerOrAdmin } = require('../middleware/auth');
const { 
  validateUserUpdate, 
  validateUserQuery, 
  validateUuidParam 
} = require('../middleware/validation');
const { handleUserDataEncryption, removeSensitiveFields } = require('../middleware/encryption');
const { logUserActivity } = require('../middleware/logging');
const { asyncErrorWrapper } = require('../middleware/errorHandler');

// Apply authentication to all routes
router.use(authenticateToken);

// Remove sensitive fields from all responses
router.use(removeSensitiveFields(['password_hash', 'password']));

/**
 * @route   GET /api/users
 * @desc    Get all users (Admin only)
 * @access  Private/Admin
 */
router.get('/',
  requireAdmin,
  validateUserQuery,
  handleUserDataEncryption,
  logUserActivity('view_all_users'),
  asyncErrorWrapper(userController.getAllUsers)
);

/**
 * @route   GET /api/users/search
 * @desc    Search users
 * @access  Private
 */
router.get('/search',
  logUserActivity('search_users'),
  asyncErrorWrapper(userController.searchUsers)
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Own profile or Admin)
 */
router.get('/:id',
  validateUuidParam('id'),
  requireOwnerOrAdmin('id'),
  handleUserDataEncryption,
  logUserActivity('view_user_profile'),
  asyncErrorWrapper(userController.getUserById)
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Own profile or Admin)
 */
router.put('/:id',
  validateUuidParam('id'),
  requireOwnerOrAdmin('id'),
  validateUserUpdate,
  handleUserDataEncryption,
  logUserActivity('update_user_profile'),
  asyncErrorWrapper(userController.updateUser)
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (Admin only)
 * @access  Private/Admin
 */
router.delete('/:id',
  validateUuidParam('id'),
  requireAdmin,
  logUserActivity('delete_user'),
  asyncErrorWrapper(userController.deleteUser)
);

/**
 * @route   GET /api/users/:id/profile
 * @desc    Get user profile with extended information
 * @access  Private (Own profile or Admin)
 */
router.get('/:id/profile',
  validateUuidParam('id'),
  requireOwnerOrAdmin('id'),
  handleUserDataEncryption,
  logUserActivity('view_extended_profile'),
  asyncErrorWrapper(userController.getUserProfile)
);

/**
 * @route   PUT /api/users/:id/preferences
 * @desc    Update user preferences
 * @access  Private (Own profile or Admin)
 */
router.put('/:id/preferences',
  validateUuidParam('id'),
  requireOwnerOrAdmin('id'),
  logUserActivity('update_preferences'),
  asyncErrorWrapper(userController.updateUserPreferences)
);

/**
 * @route   PUT /api/users/:id/accessibility
 * @desc    Update accessibility settings
 * @access  Private (Own profile or Admin)
 */
router.put('/:id/accessibility',
  validateUuidParam('id'),
  requireOwnerOrAdmin('id'),
  logUserActivity('update_accessibility_settings'),
  asyncErrorWrapper(userController.updateAccessibilitySettings)
);

/**
 * @route   POST /api/users/:id/location
 * @desc    Add location to user history
 * @access  Private (Own profile or Admin)
 */
router.post('/:id/location',
  validateUuidParam('id'),
  requireOwnerOrAdmin('id'),
  logUserActivity('add_location_history'),
  asyncErrorWrapper(userController.addLocationHistory)
);

/**
 * @route   GET /api/users/:id/statistics
 * @desc    Get user statistics
 * @access  Private (Own profile or Admin)
 */
router.get('/:id/statistics',
  validateUuidParam('id'),
  requireOwnerOrAdmin('id'),
  logUserActivity('view_user_statistics'),
  asyncErrorWrapper(userController.getUserStatistics)
);

module.exports = router;
