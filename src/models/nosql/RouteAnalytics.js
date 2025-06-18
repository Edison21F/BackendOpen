const mongoose = require('mongoose');

const routeAnalyticsSchema = new mongoose.Schema({
  route_id: {
    type: String,
    required: true,
    index: true
  },
  usage_statistics: {
    total_uses: {
      type: Number,
      default: 0
    },
    unique_users: {
      type: Number,
      default: 0
    },
    average_duration: {
      type: Number,
      default: 0
    },
    completion_rate: {
      type: Number,
      default: 0
    },
    daily_usage: [{
      date: Date,
      count: Number
    }],
    hourly_distribution: [{
      hour: {
        type: Number,
        min: 0,
        max: 23
      },
      count: Number
    }]
  },
  performance_metrics: {
    average_load_time: {
      type: Number,
      default: 0
    },
    error_rate: {
      type: Number,
      default: 0
    },
    success_rate: {
      type: Number,
      default: 100
    },
    response_times: [{
      timestamp: Date,
      duration: Number
    }]
  },
  user_feedback: [{
    user_id: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    helpful_votes: {
      type: Number,
      default: 0
    }
  }],
  geographic_data: {
    most_used_locations: [{
      latitude: Number,
      longitude: Number,
      usage_count: Number
    }],
    coverage_area: {
      center: {
        latitude: Number,
        longitude: Number
      },
      radius: Number
    },
    popular_times: [{
      day_of_week: {
        type: Number,
        min: 0,
        max: 6
      },
      hour: {
        type: Number,
        min: 0,
        max: 23
      },
      usage_intensity: Number
    }]
  },
  weather_conditions: [{
    timestamp: Date,
    condition: String,
    temperature: Number,
    humidity: Number,
    usage_impact: Number
  }],
  traffic_data: [{
    timestamp: Date,
    congestion_level: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    average_speed: Number,
    incidents: [{
      type: String,
      location: String,
      severity: String
    }]
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'route_analytics',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for better query performance
routeAnalyticsSchema.index({ route_id: 1 });
routeAnalyticsSchema.index({ 'usage_statistics.daily_usage.date': -1 });
routeAnalyticsSchema.index({ 'user_feedback.timestamp': -1 });

module.exports = mongoose.model('RouteAnalytics', routeAnalyticsSchema);
