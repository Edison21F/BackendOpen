const mongoose = require('mongoose');

const voiceGuideSchema = new mongoose.Schema({
  route_id: {
    type: String,
    required: true
    // Sin index: true - se define abajo
  },
  audio_file_url: {
    type: String,
    required: true
  },
  audio_metadata: {
    duration: {
      type: Number,
      required: true
    },
    format: {
      type: String,
      enum: ['mp3', 'wav', 'ogg', 'm4a'],
      default: 'mp3'
    },
    bitrate: Number,
    sample_rate: Number,
    file_size: Number,
    checksum: String
  },
  language: {
    type: String,
    required: true,
    default: 'es',
    enum: ['es', 'en', 'fr', 'de', 'it', 'pt']
    // Sin index: true - se define abajo
  },
  voice_settings: {
    voice_type: {
      type: String,
      enum: ['male', 'female'],
      default: 'female'
      // Sin index: true - se define abajo si es necesario
    },
    speed: {
      type: Number,
      default: 1.0,
      min: 0.5,
      max: 2.0
    },
    pitch: {
      type: Number,
      default: 1.0,
      min: 0.5,
      max: 2.0
    },
    volume: {
      type: Number,
      default: 1.0,
      min: 0.1,
      max: 2.0
    },
    emphasis: {
      type: String,
      enum: ['none', 'strong', 'moderate'],
      default: 'moderate'
    }
  },
  transcription: {
    type: String,
    required: true
  },
  segments: [{
    start_time: Number,
    end_time: Number,
    text: String,
    location_reference: {
      latitude: Number,
      longitude: Number,
      description: String
    }
  }],
  accessibility_features: {
    audio_description: String,
    tactile_cues: [String],
    alternative_formats: [{
      type: {
        type: String,
        enum: ['braille', 'large_print', 'sign_language']
      },
      url: String
    }]
  },
  usage_stats: {
    play_count: {
      type: Number,
      default: 0
    },
    completion_rate: {
      type: Number,
      default: 0
    },
    average_listen_duration: {
      type: Number,
      default: 0
    },
    skip_points: [{
      timestamp: Number,
      skip_count: Number
    }]
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'voice_guides',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Índices definidos aquí - sin duplicados
voiceGuideSchema.index({ route_id: 1 }); // Índice por route_id
voiceGuideSchema.index({ language: 1 }); // Índice por idioma
voiceGuideSchema.index({ 'voice_settings.voice_type': 1 }); // Índice por tipo de voz

module.exports = mongoose.model('VoiceGuide', voiceGuideSchema);