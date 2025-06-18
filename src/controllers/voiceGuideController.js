const VoiceGuide = require('../models/nosql/VoiceGuide');
const Route = require('../models/sql/Route');
const logService = require('../services/logService');

class VoiceGuideController {
  /**
   * Get all voice guides with pagination and filtering
   */
  async getAllVoiceGuides(req, res) {
    try {
      const { page = 1, limit = 10, route_id, language } = req.query;
      const skip = (page - 1) * limit;

      const query = {};
      
      if (route_id) {
        query.route_id = route_id;
      }
      
      if (language) {
        query.language = language;
      }

      const total = await VoiceGuide.countDocuments(query);
      const voiceGuides = await VoiceGuide.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      res.status(200).json({
        success: true,
        message: 'Voice guides retrieved successfully',
        data: {
          voice_guides: voiceGuides,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logService.error('Error in getAllVoiceGuides:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve voice guides'
      });
    }
  }

  /**
   * Get voice guide by ID
   */
  async getVoiceGuideById(req, res) {
    try {
      const { id } = req.params;
      
      const voiceGuide = await VoiceGuide.findById(id);

      if (!voiceGuide) {
        return res.status(404).json({
          success: false,
          message: 'Voice guide not found'
        });
      }

      // Increment play count
      voiceGuide.usage_stats.play_count += 1;
      await voiceGuide.save();

      res.status(200).json({
        success: true,
        message: 'Voice guide retrieved successfully',
        data: { voice_guide: voiceGuide }
      });
    } catch (error) {
      logService.error('Error in getVoiceGuideById:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve voice guide'
      });
    }
  }

  /**
   * Create new voice guide
   */
  async createVoiceGuide(req, res) {
    try {
      const voiceGuideData = req.body;
      const userId = req.user.id;

      // Verify that the route exists
      const route = await Route.findByPk(voiceGuideData.route_id);
      if (!route) {
        return res.status(404).json({
          success: false,
          message: 'Route not found'
        });
      }

      // Check if user can create voice guides for this route
      if (req.user.rol !== 'admin' && route.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to create voice guides for this route'
        });
      }

      const voiceGuide = new VoiceGuide({
        ...voiceGuideData,
        usage_stats: {
          play_count: 0,
          completion_rate: 0,
          average_listen_duration: 0,
          skip_points: []
        }
      });

      await voiceGuide.save();

      logService.info('Voice guide created', { 
        voiceGuideId: voiceGuide._id, 
        userId, 
        routeId: voiceGuideData.route_id 
      });

      res.status(201).json({
        success: true,
        message: 'Voice guide created successfully',
        data: { voice_guide: voiceGuide }
      });
    } catch (error) {
      logService.error('Error in createVoiceGuide:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create voice guide'
      });
    }
  }

  /**
   * Update voice guide
   */
  async updateVoiceGuide(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user.id;

      // Check if voice guide exists
      const existingGuide = await VoiceGuide.findById(id);
      if (!existingGuide) {
        return res.status(404).json({
          success: false,
          message: 'Voice guide not found'
        });
      }

      // Verify route ownership
      const route = await Route.findByPk(existingGuide.route_id);
      if (!route) {
        return res.status(404).json({
          success: false,
          message: 'Associated route not found'
        });
      }

      // Check authorization: route creator or admin can update
      if (req.user.rol !== 'admin' && route.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to update this voice guide'
        });
      }

      // Update the voice guide
      const updatedGuide = await VoiceGuide.findByIdAndUpdate(
        id,
        { 
          ...updateData,
          updated_at: new Date()
        },
        { new: true }
      );

      logService.info('Voice guide updated', { 
        voiceGuideId: id, 
        userId, 
        fields: Object.keys(updateData) 
      });

      res.status(200).json({
        success: true,
        message: 'Voice guide updated successfully',
        data: { voice_guide: updatedGuide }
      });
    } catch (error) {
      logService.error('Error in updateVoiceGuide:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update voice guide'
      });
    }
  }

  /**
   * Delete voice guide
   */
  async deleteVoiceGuide(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if voice guide exists
      const existingGuide = await VoiceGuide.findById(id);
      if (!existingGuide) {
        return res.status(404).json({
          success: false,
          message: 'Voice guide not found'
        });
      }

      // Verify route ownership
      const route = await Route.findByPk(existingGuide.route_id);
      if (!route) {
        return res.status(404).json({
          success: false,
          message: 'Associated route not found'
        });
      }

      // Check authorization: route creator or admin can delete
      if (req.user.rol !== 'admin' && route.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to delete this voice guide'
        });
      }

      await VoiceGuide.findByIdAndDelete(id);

      logService.info('Voice guide deleted', { voiceGuideId: id, userId });

      res.status(200).json({
        success: true,
        message: 'Voice guide deleted successfully'
      });
    } catch (error) {
      logService.error('Error in deleteVoiceGuide:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete voice guide'
      });
    }
  }

  /**
   * Get voice guides by route ID
   */
  async getVoiceGuidesByRoute(req, res) {
    try {
      const { route_id } = req.params;
      const { language } = req.query;

      // Verify route exists
      const route = await Route.findByPk(route_id);
      if (!route) {
        return res.status(404).json({
          success: false,
          message: 'Route not found'
        });
      }

      const query = { route_id };
      if (language) {
        query.language = language;
      }

      const voiceGuides = await VoiceGuide.find(query).sort({ created_at: -1 });

      res.status(200).json({
        success: true,
        message: 'Route voice guides retrieved successfully',
        data: { voice_guides: voiceGuides }
      });
    } catch (error) {
      logService.error('Error in getVoiceGuidesByRoute:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve route voice guides'
      });
    }
  }

  /**
   * Record voice guide usage
   */
  async recordVoiceGuideUsage(req, res) {
    try {
      const { id } = req.params;
      const { listen_duration, completion_status, skip_points } = req.body;

      const voiceGuide = await VoiceGuide.findById(id);
      if (!voiceGuide) {
        return res.status(404).json({
          success: false,
          message: 'Voice guide not found'
        });
      }

      // Update usage statistics
      voiceGuide.usage_stats.play_count += 1;

      if (listen_duration !== undefined) {
        const currentAvg = voiceGuide.usage_stats.average_listen_duration || 0;
        const playCount = voiceGuide.usage_stats.play_count;
        voiceGuide.usage_stats.average_listen_duration = 
          (currentAvg * (playCount - 1) + listen_duration) / playCount;
      }

      if (completion_status !== undefined) {
        const completedPlays = completion_status ? 1 : 0;
        const currentRate = voiceGuide.usage_stats.completion_rate || 0;
        const playCount = voiceGuide.usage_stats.play_count;
        voiceGuide.usage_stats.completion_rate = 
          (currentRate * (playCount - 1) + completedPlays) / playCount;
      }

      if (skip_points && Array.isArray(skip_points)) {
        skip_points.forEach(point => {
          const existingPoint = voiceGuide.usage_stats.skip_points.find(
            sp => Math.abs(sp.timestamp - point) < 1
          );
          if (existingPoint) {
            existingPoint.skip_count += 1;
          } else {
            voiceGuide.usage_stats.skip_points.push({
              timestamp: point,
              skip_count: 1
            });
          }
        });
      }

      await voiceGuide.save();

      res.status(200).json({
        success: true,
        message: 'Voice guide usage recorded successfully'
      });
    } catch (error) {
      logService.error('Error in recordVoiceGuideUsage:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to record voice guide usage'
      });
    }
  }

  /**
   * Get voice guide analytics
   */
  async getVoiceGuideAnalytics(req, res) {
    try {
      const { id } = req.params;

      const voiceGuide = await VoiceGuide.findById(id);
      if (!voiceGuide) {
        return res.status(404).json({
          success: false,
          message: 'Voice guide not found'
        });
      }

      // Verify user can access analytics
      const route = await Route.findByPk(voiceGuide.route_id);
      if (!route) {
        return res.status(404).json({
          success: false,
          message: 'Associated route not found'
        });
      }

      if (req.user.rol !== 'admin' && route.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to view analytics'
        });
      }

      const analytics = {
        play_count: voiceGuide.usage_stats.play_count,
        completion_rate: voiceGuide.usage_stats.completion_rate,
        average_listen_duration: voiceGuide.usage_stats.average_listen_duration,
        skip_points: voiceGuide.usage_stats.skip_points,
        audio_duration: voiceGuide.audio_metadata.duration,
        language: voiceGuide.language,
        created_at: voiceGuide.created_at
      };

      res.status(200).json({
        success: true,
        message: 'Voice guide analytics retrieved successfully',
        data: { analytics }
      });
    } catch (error) {
      logService.error('Error in getVoiceGuideAnalytics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve voice guide analytics'
      });
    }
  }
}

module.exports = new VoiceGuideController();
