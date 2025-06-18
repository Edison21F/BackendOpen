const routeService = require('../services/routeService');
const logService = require('../services/logService');

class RouteController {
  /**
   * Get all routes with pagination and filtering
   */
  async getAllRoutes(req, res) {
    try {
      const options = req.query;
      const result = await routeService.getAllRoutes(options);

      res.status(200).json({
        success: true,
        message: 'Routes retrieved successfully',
        data: result
      });
    } catch (error) {
      logService.error('Error in getAllRoutes:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve routes'
      });
    }
  }

  /**
   * Get route by ID
   */
  async getRouteById(req, res) {
    try {
      const { id } = req.params;
      const route = await routeService.getRouteById(id);

      if (!route) {
        return res.status(404).json({
          success: false,
          message: 'Route not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Route retrieved successfully',
        data: { route }
      });
    } catch (error) {
      logService.error('Error in getRouteById:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve route'
      });
    }
  }

  /**
   * Create new route
   */
  async createRoute(req, res) {
    try {
      const routeData = req.body;
      const userId = req.user.id;

      const route = await routeService.createRoute(routeData, userId);

      res.status(201).json({
        success: true,
        message: 'Route created successfully',
        data: { route }
      });
    } catch (error) {
      logService.error('Error in createRoute:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create route'
      });
    }
  }

  /**
   * Update route
   */
  async updateRoute(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user.id;

      // Check if route exists
      const existingRoute = await routeService.getRouteById(id);
      if (!existingRoute) {
        return res.status(404).json({
          success: false,
          message: 'Route not found'
        });
      }

      // Check authorization: route creator or admin can update
      if (req.user.rol !== 'admin' && existingRoute.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to update this route'
        });
      }

      const updatedRoute = await routeService.updateRoute(id, updateData, userId);

      res.status(200).json({
        success: true,
        message: 'Route updated successfully',
        data: { route: updatedRoute }
      });
    } catch (error) {
      logService.error('Error in updateRoute:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update route'
      });
    }
  }

  /**
   * Delete route
   */
  async deleteRoute(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if route exists
      const existingRoute = await routeService.getRouteById(id);
      if (!existingRoute) {
        return res.status(404).json({
          success: false,
          message: 'Route not found'
        });
      }

      // Check authorization: route creator or admin can delete
      if (req.user.rol !== 'admin' && existingRoute.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to delete this route'
        });
      }

      await routeService.deleteRoute(id, userId);

      res.status(200).json({
        success: true,
        message: 'Route deleted successfully'
      });
    } catch (error) {
      logService.error('Error in deleteRoute:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete route'
      });
    }
  }

  /**
   * Get routes created by current user
   */
  async getUserRoutes(req, res) {
    try {
      const userId = req.user.id;
      const options = req.query;

      const routes = await routeService.getRoutesByUser(userId, options);

      res.status(200).json({
        success: true,
        message: 'User routes retrieved successfully',
        data: { routes }
      });
    } catch (error) {
      logService.error('Error in getUserRoutes:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve user routes'
      });
    }
  }

  /**
   * Record route usage
   */
  async recordRouteUsage(req, res) {
    try {
      const { id } = req.params;
      const usageData = req.body;
      const userId = req.user.id;

      // Check if route exists and is active
      const route = await routeService.getRouteById(id);
      if (!route) {
        return res.status(404).json({
          success: false,
          message: 'Route not found'
        });
      }

      if (route.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Route is not active'
        });
      }

      await routeService.recordRouteUsage(id, userId, usageData);

      res.status(201).json({
        success: true,
        message: 'Route usage recorded successfully'
      });
    } catch (error) {
      logService.error('Error in recordRouteUsage:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to record route usage'
      });
    }
  }

  /**
   * Add route feedback
   */
  async addRouteFeedback(req, res) {
    try {
      const { id } = req.params;
      const feedbackData = req.body;
      const userId = req.user.id;

      // Check if route exists
      const route = await routeService.getRouteById(id);
      if (!route) {
        return res.status(404).json({
          success: false,
          message: 'Route not found'
        });
      }

      await routeService.addRouteFeedback(id, userId, feedbackData);

      res.status(201).json({
        success: true,
        message: 'Route feedback added successfully'
      });
    } catch (error) {
      logService.error('Error in addRouteFeedback:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to add route feedback'
      });
    }
  }

  /**
   * Get route analytics
   */
  async getRouteAnalytics(req, res) {
    try {
      const { id } = req.params;

      // Check if route exists
      const route = await routeService.getRouteById(id);
      if (!route) {
        return res.status(404).json({
          success: false,
          message: 'Route not found'
        });
      }

      // Check authorization: route creator or admin can view analytics
      if (req.user.rol !== 'admin' && route.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to view route analytics'
        });
      }

      const analytics = await routeService.getRouteAnalytics(id);

      res.status(200).json({
        success: true,
        message: 'Route analytics retrieved successfully',
        data: { analytics }
      });
    } catch (error) {
      logService.error('Error in getRouteAnalytics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve route analytics'
      });
    }
  }

  /**
   * Get popular routes
   */
  async getPopularRoutes(req, res) {
    try {
      const options = req.query;
      const routes = await routeService.getPopularRoutes(options);

      res.status(200).json({
        success: true,
        message: 'Popular routes retrieved successfully',
        data: { routes }
      });
    } catch (error) {
      logService.error('Error in getPopularRoutes:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve popular routes'
      });
    }
  }

  /**
   * Search routes
   */
  async searchRoutes(req, res) {
    try {
      const { q: searchTerm, ...options } = req.query;

      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search term must be at least 2 characters long'
        });
      }

      const routes = await routeService.searchRoutes(searchTerm.trim(), options);

      res.status(200).json({
        success: true,
        message: 'Routes search completed successfully',
        data: { routes }
      });
    } catch (error) {
      logService.error('Error in searchRoutes:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to search routes'
      });
    }
  }

  /**
   * Get route statistics
   */
  async getRouteStatistics(req, res) {
    try {
      const { id } = req.params;

      // Check if route exists
      const route = await routeService.getRouteById(id);
      if (!route) {
        return res.status(404).json({
          success: false,
          message: 'Route not found'
        });
      }

      const statistics = await routeService.getRouteStatistics(id);

      res.status(200).json({
        success: true,
        message: 'Route statistics retrieved successfully',
        data: { statistics }
      });
    } catch (error) {
      logService.error('Error in getRouteStatistics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve route statistics'
      });
    }
  }
}

module.exports = new RouteController();
