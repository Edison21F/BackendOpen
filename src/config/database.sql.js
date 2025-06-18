const { Sequelize } = require('sequelize');
const config = require('./config');

// Create PostgreSQL connection
const sequelize = config.database.postgres.url 
  ? new Sequelize(config.database.postgres.url, {
      dialect: config.database.postgres.dialect,
      logging: config.database.postgres.logging,
      pool: config.database.postgres.pool,
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
      }
    })
  : new Sequelize(
      config.database.postgres.database,
      config.database.postgres.username,
      config.database.postgres.password,
      {
        host: config.database.postgres.host,
        port: config.database.postgres.port,
        dialect: config.database.postgres.dialect,
        logging: config.database.postgres.logging,
        pool: config.database.postgres.pool,
        define: {
          timestamps: true,
          underscored: true,
          freezeTableName: true
        }
      }
    );

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection established successfully');
  } catch (error) {
    console.error('❌ Unable to connect to PostgreSQL database:', error);
    process.exit(1);
  }
};

// Initialize database connection
const initializeDatabase = async () => {
  await testConnection();
  
  // Sync all models
  try {
    await sequelize.sync({ alter: false });
    console.log('✅ PostgreSQL models synchronized successfully');
  } catch (error) {
    console.error('❌ Error synchronizing PostgreSQL models:', error);
  }
};

module.exports = {
  sequelize,
  testConnection,
  initializeDatabase
};
