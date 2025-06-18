const express = require('express');
const router = express.Router();
const voiceGuideController = require('../controllers/voiceGuideController');
const { authenticateToken, requireUser, optionalAuth } = require('../middleware/auth');
const { 
  validateVoiceGuideCreate,
  validatePaginationQuery,
  validateUuidParam 
} = require('../middleware/validation');
const { removeSensitiveFields } = require('../middleware/encryption');
const { logUserActivity } = require('../middleware/logging');
const { asyncErrorWrapper } = require('../middleware/errorHandler');

// Remove sensitive fields from all responses
router.use(removeSensitiveFields(['password_hash', 'password']));

/**
 * @route   GET /api/voice-guides
 * @desc    Get all voice guides
 * @access  Public (with optional auth for personalized results)
 */
router.get('/',
  optionalAuth,
  validatePaginationQuery,
  logUserActivity('view_voice_guides'),
  asyncErrorWrapper(voiceGuideController.getAllVoiceGuides)
);

/**
 * @route   POST /api/voice-guides
 * @desc    Create new voice guide
 * @access  Private
 */
router.post('/',
  authenticateToken,
  requireUser,
  validateVoiceGuideCreate,
  logUserActivity('create_voice_guide'),
  asyncErrorWrapper(voiceGuideController.createVoiceGuide)
);

/**
 * @route   GET /api/voice-guides/:id
 * @desc    Get voice guide by ID
 * @access  Public
 */
router.get('/:id',
  validateUuidParam('id'),
  optionalAuth,
  logUserActivity('view_voice_guide_details'),
  asyncErrorWrapper(voiceGuideController.getVoiceGuideById)
);

/**
 * @route   PUT /api/voice-guides/:id
 * @desc    Update voice guide
 * @access  Private (Route creator or Admin)
 */
router.put('/:id',
  authenticateToken,
  requireUser,
  validateUuidParam('id'),
  logUserActivity('update_voice_guide'),
  asyncErrorWrapper(voiceGuideController.updateVoiceGuide)
);

/**
 * @route   DELETE /api/voice-guides/:id
 * @desc    Delete voice guide
 * @access  Private (Route creator or Admin)
 */
router.delete('/:id',
  authenticateToken,
  requireUser,
  validateUuidParam('id'),
  logUserActivity('delete_voice_guide'),
  asyncErrorWrapper(voiceGuideController.deleteVoiceGuide)
);

/**
 * @route   GET /api/voice-guides/route/:route_id
 * @desc    Get voice guides by route ID
 * @access  Public
 */
router.get('/route/:route_id',
  validateUuidParam('route_id'),
  optionalAuth,
  logUserActivity('view_route_voice_guides'),
  asyncErrorWrapper(voiceGuideController.getVoiceGuidesByRoute)
);

/**
 * @route   POST /api/voice-guides/:id/usage
 * @desc    Record voice guide usage
 * @access  Private
 */
router.post('/:id/usage',
  authenticateToken,
  requireUser,
  validateUuidParam('id'),
  logUserActivity('record_voice_guide_usage'),
  asyncErrorWrapper(voiceGuideController.recordVoiceGuideUsage)
);

/**
 * @route   GET /api/voice-guides/:id/analytics
 * @desc    Get voice guide analytics
 * @access  Private (Route creator or Admin)
 */
router.get('/:id/analytics',
  authenticateToken,
  requireUser,
  validateUuidParam('id'),
  logUserActivity('view_voice_guide_analytics'),
  asyncErrorWrapper(voiceGuideController.getVoiceGuideAnalytics)
);

module.exports = router;
