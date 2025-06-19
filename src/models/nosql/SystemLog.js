const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
    // Removido: index: true - porque ya se define abajo con schema.index()
  },
  level: {
    type: String,
    required: true,
    enum: ['info', 'warn', 'error', 'debug']
    // Removido: index: true
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
    required: true
    // Removido: index: true
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
    default: null
    // Removido: index: true
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
  timestamps: false, // Deshabilitado porque usamos timestamp manual
  capped: { size: 100000000, max: 1000000 } // 100MB cap, max 1M documents
});

// Índices definidos aquí - sin duplicados
systemLogSchema.index({ timestamp: -1 }); // Índice principal por timestamp descendente
systemLogSchema.index({ level: 1, timestamp: -1 }); // Compuesto por level y timestamp
systemLogSchema.index({ user_id: 1, timestamp: -1 }); // Compuesto por user_id y timestamp
systemLogSchema.index({ status_code: 1, timestamp: -1 }); // Compuesto por status_code y timestamp
systemLogSchema.index({ method: 1, url: 1 }); // Compuesto por method y url

// TTL index para eliminar logs antiguos automáticamente (30 días)
systemLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('SystemLog', systemLogSchema);