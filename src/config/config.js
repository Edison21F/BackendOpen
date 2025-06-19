const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 5000,
    host: '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development'
  },

  // Database configuration
  database: {
    postgres: {
      // Use DATABASE_URL if available, otherwise individual components
      url: process.env.DATABASE_URL,
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT) || 5432,
      database: process.env.PGDATABASE || 'openblind_db',
      username: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || '12345',
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    },
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/openblind_nosql'
    }
  },

  // Security configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production',
    jwtExpiresIn: '24h',
    encryptionKey: process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key-here',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs/',
    filename: 'application.log'
  },

  // Pagination defaults
  pagination: {
    defaultLimit: 10,
    maxLimit: 100
  }
};

module.exports = config;
