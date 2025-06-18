const { sequelize } = require('../config/database.sql');
const { connectMongoDB } = require('../config/database.orm');
const logService = require('./logService');

class DatabaseService {
  constructor() {
    this.postgresConnection = null;
    this.mongoConnection = null;
  }

  /**
   * Initialize all database connections
   */
  async initializeConnections() {
    try {
      // Initialize PostgreSQL
      await this.initializePostgreSQL();
      
      // Skip MongoDB for now since it's not available in this environment
      logService.info('MongoDB initialization skipped - not available in this environment');
      
      logService.info('Database connections initialized successfully');
    } catch (error) {
      logService.error('Failed to initialize database connections:', error);
      throw error;
    }
  }

  /**
   * Initialize PostgreSQL connection
   */
  async initializePostgreSQL() {
    try {
      await sequelize.authenticate();
      this.postgresConnection = sequelize;
      
      // Sync models in development
      if (process.env.NODE_ENV === 'development') {
        await sequelize.sync({ alter: false });
      }
      
      logService.info('PostgreSQL connection established successfully');
    } catch (error) {
      logService.error('PostgreSQL connection failed:', error);
      throw error;
    }
  }

  /**
   * Initialize MongoDB connection
   */
  async initializeMongoDB() {
    try {
      await connectMongoDB();
      logService.info('MongoDB connection established successfully');
    } catch (error) {
      logService.error('MongoDB connection failed:', error);
      throw error;
    }
  }

  /**
   * Get PostgreSQL connection
   * @returns {Object} - Sequelize instance
   */
  getPostgreSQLConnection() {
    if (!this.postgresConnection) {
      throw new Error('PostgreSQL connection not initialized');
    }
    return this.postgresConnection;
  }

  /**
   * Check PostgreSQL connection health
   * @returns {Promise<boolean>} - Connection health status
   */
  async checkPostgreSQLHealth() {
    try {
      await sequelize.authenticate();
      return true;
    } catch (error) {
      logService.error('PostgreSQL health check failed:', error);
      return false;
    }
  }

  /**
   * Check MongoDB connection health
   * @returns {Promise<boolean>} - Connection health status
   */
  async checkMongoDBHealth() {
    try {
      const mongoose = require('mongoose');
      return mongoose.connection.readyState === 1;
    } catch (error) {
      logService.error('MongoDB health check failed:', error);
      return false;
    }
  }

  /**
   * Execute PostgreSQL transaction
   * @param {Function} callback - Transaction callback
   * @returns {Promise<any>} - Transaction result
   */
  async executeTransaction(callback) {
    const transaction = await sequelize.transaction();
    
    try {
      const result = await callback(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      logService.error('Transaction failed and rolled back:', error);
      throw error;
    }
  }

  /**
   * Close all database connections
   */
  async closeConnections() {
    try {
      // Close PostgreSQL connection
      if (this.postgresConnection) {
        await this.postgresConnection.close();
        logService.info('PostgreSQL connection closed');
      }

      // Close MongoDB connection
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        logService.info('MongoDB connection closed');
      }
    } catch (error) {
      logService.error('Error closing database connections:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   * @returns {Promise<Object>} - Database statistics
   */
  async getStatistics() {
    try {
      const stats = {
        postgresql: {
          status: await this.checkPostgreSQLHealth(),
          pool: {
            total: sequelize.connectionManager.pool.options.max,
            used: sequelize.connectionManager.pool.used.length,
            waiting: sequelize.connectionManager.pool.pending.length
          }
        },
        mongodb: {
          status: await this.checkMongoDBHealth()
        }
      };

      return stats;
    } catch (error) {
      logService.error('Error getting database statistics:', error);
      throw error;
    }
  }
}

module.exports = new DatabaseService();
