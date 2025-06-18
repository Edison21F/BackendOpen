const express = require('express');
const router = express.Router();
const touristController = require('../controllers/touristController');
const { authenticateToken, requireUser, optionalAuth } = require('../middleware/auth');
const { 
  validateTouristCreate, 
  validateTouristUpdate,
  validatePaginationQuery,
  validateUuidParam 
} = require('../middleware/validation');
const { removeSensitiveFields } = require('../middleware/encryption');
const { logUserActivity } = require('../middleware/logging');
const { asyncErrorWrapper } = require('../middleware/errorHandler');

// Remove sensitive fields from all responses
router.use(removeSensitiveFields(['password_hash', 'password']));

/**
 * @route   GET /api/tourist-registrations
 * @desc    Get all tourist registrations
 * @access  Public (with optional auth for personalized results)
 */
router.get('/',
  optionalAuth,
  validatePaginationQuery,
  logUserActivity('view_tourist_registrations'),
  asyncErrorWrapper(touristController.getAllTouristRegistrations)
);

/**
 * @route   GET /api/tourist-registrations/search
 * @desc    Search tourist registrations
 * @access  Public
 */
router.get('/search',
  optionalAuth,
  logUserActivity('search_tourist_registrations'),
  asyncErrorWrapper(touristController.searchTouristRegistrations)
);

/**
 * @route   GET /api/tourist-registrations/nearby
 * @desc    Get tourist registrations by location
 * @access  Public
 */
router.get('/nearby',
  optionalAuth,
  logUserActivity('view_nearby_tourist_registrations'),
  asyncErrorWrapper(touristController.getTouristRegistrationsByLocation)
);

/**
 * @route   GET /api/tourist-registrations/my-registrations
 * @desc    Get current user's tourist registrations
 * @access  Private
 */
router.get('/my-registrations',
  authenticateToken,
  requireUser,
  logUserActivity('view_my_tourist_registrations'),
  asyncErrorWrapper(touristController.getUserTouristRegistrations)
);

/**
 * @route   POST /api/tourist-registrations
 * @desc    Create new tourist registration
 * @access  Private
 */
router.post('/',
  authenticateToken,
  requireUser,
  validateTouristCreate,
  logUserActivity('create_tourist_registration'),
  asyncErrorWrapper(touristController.createTouristRegistration)
);

/**
 * @route   GET /api/tourist-registrations/:id
 * @desc    Get tourist registration by ID
 * @access  Public (with optional auth for detailed view)
 */
router.get('/:id',
  validateUuidParam('id'),
  optionalAuth,
  logUserActivity('view_tourist_registration_details'),
  asyncErrorWrapper(touristController.getTouristRegistrationById)
);

/**
 * @route   PUT /api/tourist-registrations/:id
 * @desc    Update tourist registration
 * @access  Private (Registration creator or Admin)
 */
router.put('/:id',
  authenticateToken,
  requireUser,
  validateUuidParam('id'),
  validateTouristUpdate,
  logUserActivity('update_tourist_registration'),
  asyncErrorWrapper(touristController.updateTouristRegistration)
);

/**
 * @route   DELETE /api/tourist-registrations/:id
 * @desc    Delete tourist registration
 * @access  Private (Registration creator or Admin)
 */
router.delete('/:id',
  authenticateToken,
  requireUser,
  validateUuidParam('id'),
  logUserActivity('delete_tourist_registration'),
  asyncErrorWrapper(touristController.deleteTouristRegistration)
);

module.exports = router;
