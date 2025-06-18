const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  level: {
    type: String,
    required: true,
    enum: ['info', 'warn', 'error', 'debug'],
    index: true
  },
  method: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  status_code: {
    type: Number,
    required: true,
    index: true
  },
  request_body: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  response_body: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  user_id: {
    type: String,
    default: null,
    index: true
  },
  ip_address: {
    type: String,
    required: true
  },
  user_agent: {
    type: String,
    default: null
  },
  execution_time: {
    type: Number,
    required: true
  },
  error_details: {
    message: String,
    stack: String,
    code: String,
    type: String
  },
  session_id: String,
  correlation_id: String,
  headers: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  query_params: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  route_params: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  collection: 'system_logs',
  timestamps: false,
  capped: { size: 100000000, max: 1000000 } // 100MB cap, max 1M documents
});

// Indexes for better query performance
systemLogSchema.index({ timestamp: -1 });
systemLogSchema.index({ level: 1, timestamp: -1 });
systemLogSchema.index({ user_id: 1, timestamp: -1 });
systemLogSchema.index({ status_code: 1, timestamp: -1 });
systemLogSchema.index({ method: 1, url: 1 });

// TTL index to automatically delete old logs (30 days)
systemLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('SystemLog', systemLogSchema);
