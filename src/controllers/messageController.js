const PersonalizedMessage = require('../models/sql/PersonalizedMessage');
const Route = require('../models/sql/Route');
const User = require('../models/sql/User');
const encryptionService = require('../services/encryptionService');
const logService = require('../services/logService');
const { Op } = require('sequelize');

class MessageController {
  /**
   * Get all personalized messages with pagination and filtering
   */
  async getAllMessages(req, res) {
    try {
      const { page = 1, limit = 10, search, status, route_id } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      
      if (status) {
        whereClause.status = status;
      }
      
      if (route_id) {
        whereClause.route_id = route_id;
      }

      // For regular users, only show their own messages
      if (req.user.rol !== 'admin') {
        whereClause.created_by = req.user.id;
      }

      const { count, rows } = await PersonalizedMessage.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [['created_at', 'DESC']],
        include: [
          {
            model: Route,
            as: 'route',
            attributes: ['id', 'name', 'location']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id']
          }
        ]
      });

      // Decrypt messages
      const decryptedMessages = rows.map(message => {
        const messageObj = message.toJSON();
        messageObj.message = encryptionService.decryptMessage(messageObj.message);
        return messageObj;
      });

      // Filter by search term if provided (after decryption)
      let filteredMessages = decryptedMessages;
      if (search) {
        const searchTerm = search.toLowerCase();
        filteredMessages = decryptedMessages.filter(message => 
          message.message.toLowerCase().includes(searchTerm) ||
          (message.route && message.route.name.toLowerCase().includes(searchTerm))
        );
      }

      res.status(200).json({
        success: true,
        message: 'Messages retrieved successfully',
        data: {
          messages: filteredMessages,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logService.error('Error in getAllMessages:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve messages'
      });
    }
  }

  /**
   * Get message by ID
   */
  async getMessageById(req, res) {
    try {
      const { id } = req.params;
      
      const message = await PersonalizedMessage.findByPk(id, {
        include: [
          {
            model: Route,
            as: 'route',
            attributes: ['id', 'name', 'location', 'transport_name']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id']
          }
        ]
      });

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      // Check authorization: message creator or admin can view
      if (req.user.rol !== 'admin' && message.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to view this message'
        });
      }

      // Decrypt message
      const messageObj = message.toJSON();
      messageObj.message = encryptionService.decryptMessage(messageObj.message);

      res.status(200).json({
        success: true,
        message: 'Message retrieved successfully',
        data: { message: messageObj }
      });
    } catch (error) {
      logService.error('Error in getMessageById:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve message'
      });
    }
  }

  /**
   * Create new personalized message
   */
  async createMessage(req, res) {
    try {
      const { message, route_id, status = 'active' } = req.body;
      const userId = req.user.id;

      // Verify that the route exists and user has access to it
      const route = await Route.findByPk(route_id);
      if (!route) {
        return res.status(404).json({
          success: false,
          message: 'Route not found'
        });
      }

      // Check if user can create messages for this route
      if (req.user.rol !== 'admin' && route.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to create messages for this route'
        });
      }

      // Encrypt message
      const encryptedMessage = encryptionService.encryptMessage(message);

      const newMessage = await PersonalizedMessage.create({
        message: encryptedMessage,
        route_id,
        status,
        created_by: userId
      });

      // Get the created message with associations
      const createdMessage = await PersonalizedMessage.findByPk(newMessage.id, {
        include: [
          {
            model: Route,
            as: 'route',
            attributes: ['id', 'name', 'location', 'transport_name']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id']
          }
        ]
      });

      // Decrypt for response
      const responseMessage = createdMessage.toJSON();
      responseMessage.message = encryptionService.decryptMessage(responseMessage.message);

      logService.info('Message created', { messageId: newMessage.id, userId, routeId: route_id });

      res.status(201).json({
        success: true,
        message: 'Message created successfully',
        data: { message: responseMessage }
      });
    } catch (error) {
      logService.error('Error in createMessage:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create message'
      });
    }
  }

  /**
   * Update personalized message
   */
  async updateMessage(req, res) {
    try {
      const { id } = req.params;
      const { message, status } = req.body;
      const userId = req.user.id;

      // Check if message exists
      const existingMessage = await PersonalizedMessage.findByPk(id);
      if (!existingMessage) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      // Check authorization: message creator or admin can update
      if (req.user.rol !== 'admin' && existingMessage.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to update this message'
        });
      }

      const updates = {};
      if (message !== undefined) {
        updates.message = encryptionService.encryptMessage(message);
      }
      if (status !== undefined) {
        updates.status = status;
      }

      await existingMessage.update(updates);

      // Get updated message with associations
      const updatedMessage = await PersonalizedMessage.findByPk(id, {
        include: [
          {
            model: Route,
            as: 'route',
            attributes: ['id', 'name', 'location', 'transport_name']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id']
          }
        ]
      });

      // Decrypt for response
      const responseMessage = updatedMessage.toJSON();
      responseMessage.message = encryptionService.decryptMessage(responseMessage.message);

      logService.info('Message updated', { messageId: id, userId, fields: Object.keys(updates) });

      res.status(200).json({
        success: true,
        message: 'Message updated successfully',
        data: { message: responseMessage }
      });
    } catch (error) {
      logService.error('Error in updateMessage:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update message'
      });
    }
  }

  /**
   * Delete personalized message
   */
  async deleteMessage(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if message exists
      const existingMessage = await PersonalizedMessage.findByPk(id);
      if (!existingMessage) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      // Check authorization: message creator or admin can delete
      if (req.user.rol !== 'admin' && existingMessage.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to delete this message'
        });
      }

      // Soft delete by updating status
      await existingMessage.update({ status: 'inactive' });

      logService.info('Message deleted (deactivated)', { messageId: id, userId });

      res.status(200).json({
        success: true,
        message: 'Message deleted successfully'
      });
    } catch (error) {
      logService.error('Error in deleteMessage:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete message'
      });
    }
  }

  /**
   * Get messages by route ID
   */
  async getMessagesByRoute(req, res) {
    try {
      const { route_id } = req.params;
      const { status = 'active' } = req.query;

      // Verify route exists
      const route = await Route.findByPk(route_id);
      if (!route) {
        return res.status(404).json({
          success: false,
          message: 'Route not found'
        });
      }

      const messages = await PersonalizedMessage.findAll({
        where: {
          route_id,
          status
        },
        order: [['created_at', 'DESC']],
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id']
          }
        ]
      });

      // Decrypt messages
      const decryptedMessages = messages.map(message => {
        const messageObj = message.toJSON();
        messageObj.message = encryptionService.decryptMessage(messageObj.message);
        return messageObj;
      });

      res.status(200).json({
        success: true,
        message: 'Route messages retrieved successfully',
        data: { messages: decryptedMessages }
      });
    } catch (error) {
      logService.error('Error in getMessagesByRoute:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve route messages'
      });
    }
  }

  /**
   * Get user's messages
   */
  async getUserMessages(req, res) {
    try {
      const userId = req.user.id;
      const { status, limit = 50 } = req.query;

      const whereClause = { created_by: userId };
      if (status) {
        whereClause.status = status;
      }

      const messages = await PersonalizedMessage.findAll({
        where: whereClause,
        limit: parseInt(limit),
        order: [['created_at', 'DESC']],
        include: [
          {
            model: Route,
            as: 'route',
            attributes: ['id', 'name', 'location']
          }
        ]
      });

      // Decrypt messages
      const decryptedMessages = messages.map(message => {
        const messageObj = message.toJSON();
        messageObj.message = encryptionService.decryptMessage(messageObj.message);
        return messageObj;
      });

      res.status(200).json({
        success: true,
        message: 'User messages retrieved successfully',
        data: { messages: decryptedMessages }
      });
    } catch (error) {
      logService.error('Error in getUserMessages:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve user messages'
      });
    }
  }
}

module.exports = new MessageController();
