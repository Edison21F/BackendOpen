const TouristRegistration = require('../models/sql/TouristRegistration');
const User = require('../models/sql/User');
const logService = require('../services/logService');
const { Op } = require('sequelize');

class TouristController {
  /**
   * Get all tourist registrations with pagination and filtering
   */
  async getAllTouristRegistrations(req, res) {
    try {
      const { page = 1, limit = 10, search, status } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      
      if (status) {
        whereClause.status = status;
      }

      if (search) {
        whereClause[Op.or] = [
          { destination_place: { [Op.iLike]: `%${search}%` } },
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // For regular users, only show their own registrations
      if (req.user.rol !== 'admin') {
        whereClause.created_by = req.user.id;
      }

      const { count, rows } = await TouristRegistration.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [['created_at', 'DESC']],
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id']
          }
        ]
      });

      res.status(200).json({
        success: true,
        message: 'Tourist registrations retrieved successfully',
        data: {
          tourist_registrations: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logService.error('Error in getAllTouristRegistrations:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve tourist registrations'
      });
    }
  }

  /**
   * Get tourist registration by ID
   */
  async getTouristRegistrationById(req, res) {
    try {
      const { id } = req.params;
      
      const registration = await TouristRegistration.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id']
          }
        ]
      });

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: 'Tourist registration not found'
        });
      }

      // Check authorization: registration creator or admin can view
      if (req.user.rol !== 'admin' && registration.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to view this registration'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Tourist registration retrieved successfully',
        data: { tourist_registration: registration }
      });
    } catch (error) {
      logService.error('Error in getTouristRegistrationById:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve tourist registration'
      });
    }
  }

  /**
   * Create new tourist registration
   */
  async createTouristRegistration(req, res) {
    try {
      const { destination_place, name, description, latitude, longitude, status = 'active' } = req.body;
      const userId = req.user.id;

      // Validate coordinates if provided
      if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
        return res.status(400).json({
          success: false,
          message: 'Latitude must be between -90 and 90'
        });
      }

      if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
        return res.status(400).json({
          success: false,
          message: 'Longitude must be between -180 and 180'
        });
      }

      const registration = await TouristRegistration.create({
        destination_place,
        name,
        description,
        latitude,
        longitude,
        status,
        created_by: userId
      });

      // Get the created registration with associations
      const createdRegistration = await TouristRegistration.findByPk(registration.id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id']
          }
        ]
      });

      logService.info('Tourist registration created', { 
        registrationId: registration.id, 
        userId, 
        destination: destination_place 
      });

      res.status(201).json({
        success: true,
        message: 'Tourist registration created successfully',
        data: { tourist_registration: createdRegistration }
      });
    } catch (error) {
      logService.error('Error in createTouristRegistration:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create tourist registration'
      });
    }
  }

  /**
   * Update tourist registration
   */
  async updateTouristRegistration(req, res) {
    try {
      const { id } = req.params;
      const { destination_place, name, description, latitude, longitude, status } = req.body;
      const userId = req.user.id;

      // Check if registration exists
      const existingRegistration = await TouristRegistration.findByPk(id);
      if (!existingRegistration) {
        return res.status(404).json({
          success: false,
          message: 'Tourist registration not found'
        });
      }

      // Check authorization: registration creator or admin can update
      if (req.user.rol !== 'admin' && existingRegistration.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to update this registration'
        });
      }

      // Validate coordinates if provided
      if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
        return res.status(400).json({
          success: false,
          message: 'Latitude must be between -90 and 90'
        });
      }

      if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
        return res.status(400).json({
          success: false,
          message: 'Longitude must be between -180 and 180'
        });
      }

      const updates = {};
      if (destination_place !== undefined) updates.destination_place = destination_place;
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (latitude !== undefined) updates.latitude = latitude;
      if (longitude !== undefined) updates.longitude = longitude;
      if (status !== undefined) updates.status = status;

      await existingRegistration.update(updates);

      // Get updated registration with associations
      const updatedRegistration = await TouristRegistration.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id']
          }
        ]
      });

      logService.info('Tourist registration updated', { 
        registrationId: id, 
        userId, 
        fields: Object.keys(updates) 
      });

      res.status(200).json({
        success: true,
        message: 'Tourist registration updated successfully',
        data: { tourist_registration: updatedRegistration }
      });
    } catch (error) {
      logService.error('Error in updateTouristRegistration:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update tourist registration'
      });
    }
  }

  /**
   * Delete tourist registration
   */
  async deleteTouristRegistration(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if registration exists
      const existingRegistration = await TouristRegistration.findByPk(id);
      if (!existingRegistration) {
        return res.status(404).json({
          success: false,
          message: 'Tourist registration not found'
        });
      }

      // Check authorization: registration creator or admin can delete
      if (req.user.rol !== 'admin' && existingRegistration.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to delete this registration'
        });
      }

      // Soft delete by updating status
      await existingRegistration.update({ status: 'inactive' });

      logService.info('Tourist registration deleted (deactivated)', { registrationId: id, userId });

      res.status(200).json({
        success: true,
        message: 'Tourist registration deleted successfully'
      });
    } catch (error) {
      logService.error('Error in deleteTouristRegistration:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete tourist registration'
      });
    }
  }

  /**
   * Get user's tourist registrations
   */
  async getUserTouristRegistrations(req, res) {
    try {
      const userId = req.user.id;
      const { status, limit = 50 } = req.query;

      const whereClause = { created_by: userId };
      if (status) {
        whereClause.status = status;
      }

      const registrations = await TouristRegistration.findAll({
        where: whereClause,
        limit: parseInt(limit),
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        message: 'User tourist registrations retrieved successfully',
        data: { tourist_registrations: registrations }
      });
    } catch (error) {
      logService.error('Error in getUserTouristRegistrations:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve user tourist registrations'
      });
    }
  }

  /**
   * Search tourist registrations
   */
  async searchTouristRegistrations(req, res) {
    try {
      const { q: searchTerm, ...options } = req.query;
      const { limit = 20, latitude, longitude, radius } = options;

      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search term must be at least 2 characters long'
        });
      }

      const whereClause = {
        status: 'active',
        [Op.or]: [
          { destination_place: { [Op.iLike]: `%${searchTerm}%` } },
          { name: { [Op.iLike]: `%${searchTerm}%` } },
          { description: { [Op.iLike]: `%${searchTerm}%` } }
        ]
      };

      // Geographic search if coordinates provided
      if (latitude && longitude && radius) {
        // Simple bounding box search (for more accurate results, use PostGIS)
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        const rad = parseFloat(radius) / 111; // Convert km to degrees (approximate)

        whereClause.latitude = {
          [Op.between]: [lat - rad, lat + rad]
        };
        whereClause.longitude = {
          [Op.between]: [lng - rad, lng + rad]
        };
      }

      const registrations = await TouristRegistration.findAll({
        where: whereClause,
        limit: parseInt(limit),
        order: [['created_at', 'DESC']],
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id']
          }
        ]
      });

      res.status(200).json({
        success: true,
        message: 'Tourist registrations search completed successfully',
        data: { tourist_registrations: registrations }
      });
    } catch (error) {
      logService.error('Error in searchTouristRegistrations:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to search tourist registrations'
      });
    }
  }

  /**
   * Get tourist registrations by location
   */
  async getTouristRegistrationsByLocation(req, res) {
    try {
      const { latitude, longitude, radius = 10 } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
      }

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const rad = parseFloat(radius) / 111; // Convert km to degrees (approximate)

      const registrations = await TouristRegistration.findAll({
        where: {
          status: 'active',
          latitude: {
            [Op.between]: [lat - rad, lat + rad]
          },
          longitude: {
            [Op.between]: [lng - rad, lng + rad]
          }
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

      res.status(200).json({
        success: true,
        message: 'Tourist registrations by location retrieved successfully',
        data: { tourist_registrations: registrations }
      });
    } catch (error) {
      logService.error('Error in getTouristRegistrationsByLocation:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve tourist registrations by location'
      });
    }
  }
}

module.exports = new TouristController();
