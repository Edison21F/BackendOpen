const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const { authenticateToken, requireUser, optionalAuth } = require('../middleware/auth');
const { 
  validateRouteCreate, 
  validateRouteUpdate, 
  validateRouteFeedback,
  validateRouteQuery,
  validateUuidParam 
} = require('../middleware/validation');
const { removeSensitiveFields } = require('../middleware/encryption');
const { logUserActivity } = require('../middleware/logging');
const { asyncErrorWrapper } = require('../middleware/errorHandler');

// Remove sensitive fields from all responses
router.use(removeSensitiveFields(['password_hash', 'password']));

/**
 * @route   GET /api/routes
 * @desc    Get all routes
 * @access  Public (with optional auth for personalized results)
 */
router.get('/',
  optionalAuth,
  validateRouteQuery,
  logUserActivity('view_routes'),
  asyncErrorWrapper(routeController.getAllRoutes)
);

/**
 * @route   GET /api/routes/popular
 * @desc    Get popular routes
 * @access  Public
 */
router.get('/popular',
  optionalAuth,
  logUserActivity('view_popular_routes'),
  asyncErrorWrapper(routeController.getPopularRoutes)
);

/**
 * @route   GET /api/routes/search
 * @desc    Search routes
 * @access  Public
 */
router.get('/search',
  optionalAuth,
  logUserActivity('search_routes'),
  asyncErrorWrapper(routeController.searchRoutes)
);

/**
 * @route   GET /api/routes/my-routes
 * @desc    Get current user's routes
 * @access  Private
 */
router.get('/my-routes',
  authenticateToken,
  requireUser,
  logUserActivity('view_my_routes'),
  asyncErrorWrapper(routeController.getUserRoutes)
);

/**
 * @route   POST /api/routes
 * @desc    Create new route
 * @access  Private
 */
router.post('/',
  authenticateToken,
  requireUser,
  validateRouteCreate,
  logUserActivity('create_route'),
  asyncErrorWrapper(routeController.createRoute)
);

/**
 * @route   GET /api/routes/:id
 * @desc    Get route by ID
 * @access  Public
 */
router.get('/:id',
  validateUuidParam('id'),
  optionalAuth,
  logUserActivity('view_route_details'),
  asyncErrorWrapper(routeController.getRouteById)
);

/**
 * @route   PUT /api/routes/:id
 * @desc    Update route
 * @access  Private (Route creator or Admin)
 */
router.put('/:id',
  authenticateToken,
  requireUser,
  validateUuidParam('id'),
  validateRouteUpdate,
  logUserActivity('update_route'),
  asyncErrorWrapper(routeController.updateRoute)
);

/**
 * @route   DELETE /api/routes/:id
 * @desc    Delete route
 * @access  Private (Route creator or Admin)
 */
router.delete('/:id',
  authenticateToken,
  requireUser,
  validateUuidParam('id'),
  logUserActivity('delete_route'),
  asyncErrorWrapper(routeController.deleteRoute)
);

/**
 * @route   POST /api/routes/:id/usage
 * @desc    Record route usage
 * @access  Private
 */
router.post('/:id/usage',
  authenticateToken,
  requireUser,
  validateUuidParam('id'),
  logUserActivity('record_route_usage'),
  asyncErrorWrapper(routeController.recordRouteUsage)
);

/**
 * @route   POST /api/routes/:id/feedback
 * @desc    Add route feedback
 * @access  Private
 */
router.post('/:id/feedback',
  authenticateToken,
  requireUser,
  validateUuidParam('id'),
  validateRouteFeedback,
  logUserActivity('add_route_feedback'),
  asyncErrorWrapper(routeController.addRouteFeedback)
);

/**
 * @route   GET /api/routes/:id/analytics
 * @desc    Get route analytics
 * @access  Private (Route creator or Admin)
 */
router.get('/:id/analytics',
  authenticateToken,
  requireUser,
  validateUuidParam('id'),
  logUserActivity('view_route_analytics'),
  asyncErrorWrapper(routeController.getRouteAnalytics)
);

/**
 * @route   GET /api/routes/:id/statistics
 * @desc    Get route statistics
 * @access  Public
 */
router.get('/:id/statistics',
  validateUuidParam('id'),
  optionalAuth,
  logUserActivity('view_route_statistics'),
  asyncErrorWrapper(routeController.getRouteStatistics)
);

module.exports = router;
