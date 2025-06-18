const createApp = require('./src/app');
const config = require('./src/config/config');
const logService = require('./src/services/logService');
const databaseService = require('./src/services/databaseService');
const { gracefulShutdown } = require('./src/middleware/errorHandler');

/**
 * Initialize and start the server
 */
const startServer = async () => {
  try {
    // Log startup
    logService.info('Starting OpenBlind Backend Server...', {
      nodeEnv: config.server.nodeEnv,
      port: config.server.port,
      host: config.server.host
    });

    // Initialize database connections
    logService.info('Initializing database connections...');
    await databaseService.initializeConnections();

    // Create Express app
    const app = createApp();

    // Start HTTP server
    const server = app.listen(config.server.port, config.server.host, () => {
      logService.info('🚀 OpenBlind Backend Server started successfully', {
        port: config.server.port,
        host: config.server.host,
        nodeEnv: config.server.nodeEnv,
        pid: process.pid
      });

      // Log database status
      logService.info('✅ All systems operational', {
        databases: 'Connected',
        logging: 'Active',
        security: 'Enabled',
        monitoring: 'Active'
      });
    });

    // Server error handling
    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof config.server.port === 'string'
        ? 'Pipe ' + config.server.port
        : 'Port ' + config.server.port;

      switch (error.code) {
        case 'EACCES':
          logService.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logService.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          logService.error('Server error:', error);
          throw error;
      }
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Uncaught exception handler
    process.on('uncaughtException', (error) => {
      logService.error('Uncaught Exception:', error);
      
      // Perform graceful shutdown
      setTimeout(() => {
        process.exit(1);
      }, 5000);
      
      gracefulShutdown('uncaughtException');
    });

    // Unhandled rejection handler
    process.on('unhandledRejection', (reason, promise) => {
      logService.error('Unhandled Rejection at:', {
        promise,
        reason
      });
      
      // Perform graceful shutdown
      setTimeout(() => {
        process.exit(1);
      }, 5000);
      
      gracefulShutdown('unhandledRejection');
    });

    return server;

  } catch (error) {
    logService.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server if this file is run directly
if (require.main === module) {
  startServer().catch((error) => {
    console.error('Fatal error during server startup:', error);
    process.exit(1);
  });
}

module.exports = startServer;
