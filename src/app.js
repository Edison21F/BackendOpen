const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

// Configuration and services
const config = require('./config/config');
const logService = require('./services/logService');
const databaseService = require('./services/databaseService');

// Middleware
const { requestLogger, performanceLogger, errorLogger } = require('./middleware/logging');
const { errorHandler, notFoundHandler, corsErrorHandler } = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const routeRoutes = require('./routes/routes');
const messageRoutes = require('./routes/messages');
const touristRoutes = require('./routes/tourist');
const voiceGuideRoutes = require('./routes/voiceGuides');

// Import all models with associations
const models = require('./models');

/**
 * Create Express application
 */
const createApp = () => {
  const app = express();

  // Trust proxy for accurate IP addresses
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false
  }));

  // CORS configuration
  const corsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // In development, allow all origins
      if (config.server.nodeEnv === 'development') {
        return callback(null, true);
      }
      
      // In production, you would specify allowed origins
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Device-Info'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count']
  };

  app.use(cors(corsOptions));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: config.server.nodeEnv === 'development' ? 1000 : 100, // Limit each IP
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      error: {
        type: 'RateLimitError',
        code: 'RATE_LIMIT_EXCEEDED'
      }
    },
    standardHeaders: true,
    legacyHeaders: false
  });

  app.use('/api', limiter);

  // Compression middleware
  app.use(compression());

  // Body parsing middleware
  app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf, encoding) => {
      try {
        JSON.parse(buf);
      } catch (err) {
        const error = new Error('Invalid JSON');
        error.statusCode = 400;
        throw error;
      }
    }
  }));
  
  app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
  }));

  // HTTP request logging
  if (config.server.nodeEnv === 'development') {
    app.use(morgan('dev'));
  }

  // Custom request logging middleware
  app.use(requestLogger);
  
  // Performance monitoring
  app.use(performanceLogger(1000)); // Log requests slower than 1s

  // Root endpoint
  app.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Welcome to OpenBlind API',
      data: {
        service: 'OpenBlind Backend API',
        version: '1.0.0',
        status: 'active',
        endpoints: {
          api: '/api',
          health: '/health',
          documentation: '/api'
        }
      }
    });
  });

  // Health check endpoint
  app.get('/health', async (req, res) => {
    try {
      const stats = await databaseService.getStatistics();
      
      res.status(200).json({
        success: true,
        message: 'Service is healthy',
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          databases: stats,
          nodeEnv: config.server.nodeEnv,
          version: process.env.npm_package_version || '1.0.0'
        }
      });
    } catch (error) {
      logService.error('Health check failed:', error);
      res.status(503).json({
        success: false,
        message: 'Service is unhealthy',
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error.message
        }
      });
    }
  });

  // API documentation endpoint
  app.get('/api', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'OpenBlind API v1.0',
      data: {
        version: '1.0.0',
        description: 'Backend API for OpenBlind - Accessibility navigation system',
        endpoints: {
          auth: '/api/auth',
          users: '/api/users',
          routes: '/api/routes',
          messages: '/api/messages',
          tourist: '/api/tourist-registrations',
          voiceGuides: '/api/voice-guides'
        },
        documentation: 'https://docs.openblind.app',
        support: 'support@openblind.app'
      }
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/routes', routeRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/tourist-registrations', touristRoutes);
  app.use('/api/voice-guides', voiceGuideRoutes);

  // CORS error handler
  app.use(corsErrorHandler);

  // Error logging middleware
  app.use(errorLogger);

  // 404 handler for undefined routes
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
