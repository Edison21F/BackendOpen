const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken, requireUser } = require('../middleware/auth');
const { 
  validateMessageCreate, 
  validateMessageUpdate,
  validatePaginationQuery,
  validateUuidParam 
} = require('../middleware/validation');
const { handleMessageEncryption, removeSensitiveFields } = require('../middleware/encryption');
const { logUserActivity } = require('../middleware/logging');
const { asyncErrorWrapper } = require('../middleware/errorHandler');

// Apply authentication to all routes
router.use(authenticateToken);
router.use(requireUser);

// Remove sensitive fields from all responses
router.use(removeSensitiveFields(['password_hash', 'password']));

/**
 * @route   GET /api/messages
 * @desc    Get all personalized messages
 * @access  Private
 */
router.get('/',
  validatePaginationQuery,
  handleMessageEncryption,
  logUserActivity('view_messages'),
  asyncErrorWrapper(messageController.getAllMessages)
);

/**
 * @route   GET /api/messages/my-messages
 * @desc    Get current user's messages
 * @access  Private
 */
router.get('/my-messages',
  handleMessageEncryption,
  logUserActivity('view_my_messages'),
  asyncErrorWrapper(messageController.getUserMessages)
);

/**
 * @route   POST /api/messages
 * @desc    Create new personalized message
 * @access  Private
 */
router.post('/',
  validateMessageCreate,
  handleMessageEncryption,
  logUserActivity('create_message'),
  asyncErrorWrapper(messageController.createMessage)
);

/**
 * @route   GET /api/messages/:id
 * @desc    Get message by ID
 * @access  Private (Message creator or Admin)
 */
router.get('/:id',
  validateUuidParam('id'),
  handleMessageEncryption,
  logUserActivity('view_message_details'),
  asyncErrorWrapper(messageController.getMessageById)
);

/**
 * @route   PUT /api/messages/:id
 * @desc    Update personalized message
 * @access  Private (Message creator or Admin)
 */
router.put('/:id',
  validateUuidParam('id'),
  validateMessageUpdate,
  handleMessageEncryption,
  logUserActivity('update_message'),
  asyncErrorWrapper(messageController.updateMessage)
);

/**
 * @route   DELETE /api/messages/:id
 * @desc    Delete personalized message
 * @access  Private (Message creator or Admin)
 */
router.delete('/:id',
  validateUuidParam('id'),
  logUserActivity('delete_message'),
  asyncErrorWrapper(messageController.deleteMessage)
);

/**
 * @route   GET /api/messages/route/:route_id
 * @desc    Get messages by route ID
 * @access  Private
 */
router.get('/route/:route_id',
  validateUuidParam('route_id'),
  handleMessageEncryption,
  logUserActivity('view_route_messages'),
  asyncErrorWrapper(messageController.getMessagesByRoute)
);

module.exports = router;
