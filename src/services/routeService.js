const Route = require('../models/sql/Route');
const RouteAnalytics = require('../models/nosql/RouteAnalytics');
const User = require('../models/sql/User');
const logService = require('./logService');
const { Op } = require('sequelize');

class RouteService {
  /**
   * Get all routes with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Routes list with pagination info
   */
  async getAllRoutes(options = {}) {
    try {
      const { page = 1, limit = 10, search, status, createdBy } = options;
      const offset = (page - 1) * limit;

      const whereClause = {};
      
      if (status) {
        whereClause.status = status;
      }
      
      if (createdBy) {
        whereClause.created_by = createdBy;
      }

      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { location: { [Op.iLike]: `%${search}%` } },
          { transport_name: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Route.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [['created_at', 'DESC']],
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'nombres', 'apellidos']
        }]
      });

      return {
        routes: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      logService.error('Error getting all routes:', error);
      throw error;
    }
  }

  /**
   * Get route by ID
   * @param {string} routeId - Route ID
   * @returns {Promise<Object|null>} - Route data
   */
  async getRouteById(routeId) {
    try {
      const route = await Route.findByPk(routeId, {
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'nombres', 'apellidos']
        }]
      });

      if (!route) {
        return null;
      }

      // Get analytics data from MongoDB
      const analytics = await RouteAnalytics.findOne({ route_id: routeId });

      return {
        ...route.toJSON(),
        analytics: analytics || null
      };
    } catch (error) {
      logService.error('Error getting route by ID:', error);
      throw error;
    }
  }

  /**
   * Create new route
   * @param {Object} routeData - Route data
   * @param {string} userId - User ID creating the route
   * @returns {Promise<Object>} - Created route
   */
  async createRoute(routeData, userId) {
    try {
      const { name, location, transport_name, status = 'active' } = routeData;

      const route = await Route.create({
        name,
        location,
        transport_name,
        status,
        created_by: userId
      });

      // Initialize analytics in MongoDB
      await RouteAnalytics.create({
        route_id: route.id,
        usage_statistics: {
          total_uses: 0,
          unique_users: 0,
          average_duration: 0,
          completion_rate: 0,
          daily_usage: [],
          hourly_distribution: Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }))
        },
        performance_metrics: {
          average_load_time: 0,
          error_rate: 0,
          success_rate: 100,
          response_times: []
        },
        user_feedback: [],
        geographic_data: {
          most_used_locations: [],
          coverage_area: {
            center: { latitude: 0, longitude: 0 },
            radius: 0
          },
          popular_times: []
        },
        weather_conditions: [],
        traffic_data: []
      });

      logService.info('Route created', { routeId: route.id, userId, name });

      return await this.getRouteById(route.id);
    } catch (error) {
      logService.error('Error creating route:', error);
      throw error;
    }
  }

  /**
   * Update route
   * @param {string} routeId - Route ID
   * @param {Object} updateData - Data to update
   * @param {string} userId - User ID making the update
   * @returns {Promise<Object>} - Updated route
   */
  async updateRoute(routeId, updateData, userId) {
    try {
      const route = await Route.findByPk(routeId);
      if (!route) {
        throw new Error('Route not found');
      }

      const { name, location, transport_name, status } = updateData;
      const updates = {};

      if (name !== undefined) updates.name = name;
      if (location !== undefined) updates.location = location;
      if (transport_name !== undefined) updates.transport_name = transport_name;
      if (status !== undefined) updates.status = status;

      await route.update(updates);

      logService.info('Route updated', { routeId, userId, fields: Object.keys(updates) });

      return await this.getRouteById(routeId);
    } catch (error) {
      logService.error('Error updating route:', error);
      throw error;
    }
  }

  /**
   * Delete route
   * @param {string} routeId - Route ID
   * @param {string} userId - User ID performing deletion
   * @returns {Promise<boolean>} - Success status
   */
  async deleteRoute(routeId, userId) {
    try {
      const route = await Route.findByPk(routeId);
      if (!route) {
        throw new Error('Route not found');
      }

      // Soft delete by updating status
      await route.update({ status: 'inactive' });

      logService.info('Route deleted (deactivated)', { routeId, userId });

      return true;
    } catch (error) {
      logService.error('Error deleting route:', error);
      throw error;
    }
  }

  /**
   * Get routes by user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - User's routes
   */
  async getRoutesByUser(userId, options = {}) {
    try {
      const { status = 'active', limit = 50 } = options;

      const routes = await Route.findAll({
        where: {
          created_by: userId,
          status
        },
        limit: parseInt(limit),
        order: [['created_at', 'DESC']]
      });

      return routes;
    } catch (error) {
      logService.error('Error getting routes by user:', error);
      throw error;
    }
  }

  /**
   * Record route usage
   * @param {string} routeId - Route ID
   * @param {string} userId - User ID
   * @param {Object} usageData - Usage data
   * @returns {Promise<boolean>} - Success status
   */
  async recordRouteUsage(routeId, userId, usageData = {}) {
    try {
      const { duration, startLocation, endLocation, completionStatus } = usageData;
      const today = new Date().toISOString().split('T')[0];
      const currentHour = new Date().getHours();

      await RouteAnalytics.findOneAndUpdate(
        { route_id: routeId },
        {
          $inc: {
            'usage_statistics.total_uses': 1,
            [`usage_statistics.hourly_distribution.${currentHour}.count`]: 1
          },
          $addToSet: {
            'usage_statistics.unique_users': userId
          },
          $push: {
            'usage_statistics.daily_usage': {
              $each: [{ date: new Date(today), count: 1 }],
              $slice: -30 // Keep only last 30 days
            }
          },
          $set: {
            updated_at: new Date()
          }
        },
        { upsert: true }
      );

      // Update completion rate if provided
      if (completionStatus !== undefined) {
        const analytics = await RouteAnalytics.findOne({ route_id: routeId });
        if (analytics) {
          const completedUses = completionStatus ? 1 : 0;
          const newCompletionRate = (analytics.usage_statistics.completion_rate * (analytics.usage_statistics.total_uses - 1) + completedUses) / analytics.usage_statistics.total_uses;
          
          await RouteAnalytics.updateOne(
            { route_id: routeId },
            { $set: { 'usage_statistics.completion_rate': newCompletionRate } }
          );
        }
      }

      logService.info('Route usage recorded', { routeId, userId, duration });

      return true;
    } catch (error) {
      logService.error('Error recording route usage:', error);
      throw error;
    }
  }

  /**
   * Add route feedback
   * @param {string} routeId - Route ID
   * @param {string} userId - User ID
   * @param {Object} feedback - Feedback data
   * @returns {Promise<boolean>} - Success status
   */
  async addRouteFeedback(routeId, userId, feedback) {
    try {
      const { rating, comment } = feedback;

      await RouteAnalytics.findOneAndUpdate(
        { route_id: routeId },
        {
          $push: {
            user_feedback: {
              user_id: userId,
              rating: parseInt(rating),
              comment,
              timestamp: new Date(),
              helpful_votes: 0
            }
          },
          $set: {
            updated_at: new Date()
          }
        },
        { upsert: true }
      );

      logService.info('Route feedback added', { routeId, userId, rating });

      return true;
    } catch (error) {
      logService.error('Error adding route feedback:', error);
      throw error;
    }
  }

  /**
   * Get route analytics
   * @param {string} routeId - Route ID
   * @returns {Promise<Object|null>} - Route analytics
   */
  async getRouteAnalytics(routeId) {
    try {
      const analytics = await RouteAnalytics.findOne({ route_id: routeId });
      return analytics;
    } catch (error) {
      logService.error('Error getting route analytics:', error);
      throw error;
    }
  }

  /**
   * Get popular routes
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Popular routes
   */
  async getPopularRoutes(options = {}) {
    try {
      const { limit = 10, timeframe = 'week' } = options;

      // Get analytics sorted by usage
      const analytics = await RouteAnalytics.find({})
        .sort({ 'usage_statistics.total_uses': -1 })
        .limit(parseInt(limit));

      // Get corresponding routes
      const routeIds = analytics.map(a => a.route_id);
      const routes = await Route.findAll({
        where: {
          id: { [Op.in]: routeIds },
          status: 'active'
        },
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'nombres', 'apellidos']
        }]
      });

      // Combine route data with analytics
      const popularRoutes = routes.map(route => {
        const analytic = analytics.find(a => a.route_id === route.id);
        return {
          ...route.toJSON(),
          usage_stats: analytic ? analytic.usage_statistics : null
        };
      });

      return popularRoutes;
    } catch (error) {
      logService.error('Error getting popular routes:', error);
      throw error;
    }
  }

  /**
   * Search routes
   * @param {string} searchTerm - Search term
   * @param {Object} options - Search options
   * @returns {Promise<Array>} - Found routes
   */
  async searchRoutes(searchTerm, options = {}) {
    try {
      const { limit = 20, location, transport } = options;

      const whereClause = {
        status: 'active',
        [Op.or]: [
          { name: { [Op.iLike]: `%${searchTerm}%` } },
          { location: { [Op.iLike]: `%${searchTerm}%` } },
          { transport_name: { [Op.iLike]: `%${searchTerm}%` } }
        ]
      };

      if (location) {
        whereClause.location = { [Op.iLike]: `%${location}%` };
      }

      if (transport) {
        whereClause.transport_name = { [Op.iLike]: `%${transport}%` };
      }

      const routes = await Route.findAll({
        where: whereClause,
        limit: parseInt(limit),
        order: [['created_at', 'DESC']],
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'nombres', 'apellidos']
        }]
      });

      return routes;
    } catch (error) {
      logService.error('Error searching routes:', error);
      throw error;
    }
  }

  /**
   * Get route statistics
   * @param {string} routeId - Route ID
   * @returns {Promise<Object>} - Route statistics
   */
  async getRouteStatistics(routeId) {
    try {
      const analytics = await RouteAnalytics.findOne({ route_id: routeId });
      
      if (!analytics) {
        return {
          total_uses: 0,
          unique_users: 0,
          average_rating: 0,
          feedback_count: 0
        };
      }

      const feedbackCount = analytics.user_feedback ? analytics.user_feedback.length : 0;
      const averageRating = feedbackCount > 0 
        ? analytics.user_feedback.reduce((sum, fb) => sum + fb.rating, 0) / feedbackCount 
        : 0;

      return {
        total_uses: analytics.usage_statistics.total_uses,
        unique_users: analytics.usage_statistics.unique_users,
        average_rating: averageRating,
        feedback_count: feedbackCount,
        completion_rate: analytics.usage_statistics.completion_rate
      };
    } catch (error) {
      logService.error('Error getting route statistics:', error);
      throw error;
    }
  }
}

module.exports = new RouteService();
