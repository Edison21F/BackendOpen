const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    unique: true
    // Removido: index: true - porque ya se define abajo
  },
  profile_image: {
    type: String,
    default: null
  },
  preferences: {
    language: {
      type: String,
      default: 'es'
    },
    voice_speed: {
      type: Number,
      default: 1.0,
      min: 0.5,
      max: 2.0
    },
    voice_type: {
      type: String,
      enum: ['male', 'female'],
      default: 'female'
    },
    notifications_enabled: {
      type: Boolean,
      default: true
    },
    location_sharing: {
      type: Boolean,
      default: false
    }
  },
  accessibility_settings: {
    high_contrast: {
      type: Boolean,
      default: false
    },
    large_text: {
      type: Boolean,
      default: false
    },
    voice_guidance: {
      type: Boolean,
      default: true
    },
    vibration_feedback: {
      type: Boolean,
      default: true
    }
  },
  last_login: {
    type: Date,
    default: null
  },
  login_history: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    ip_address: String,
    user_agent: String,
    device_info: {
      type: String,
      default: null
    }
  }],
  device_info: {
    device_type: String,
    os: String,
    browser: String,
    screen_reader: String
  },
  location_history: [{
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    accuracy: Number
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
  collection: 'user_profiles',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Índices definidos aquí - sin duplicados
userProfileSchema.index({ user_id: 1 }, { unique: true }); // Índice único por user_id
userProfileSchema.index({ last_login: -1 }); // Índice por último login
userProfileSchema.index({ 'login_history.timestamp': -1 }); // Índice por historial de login

module.exports = mongoose.model('UserProfile', userProfileSchema);