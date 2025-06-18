const { sequelize } = require('../config/database.sql');

// Import all models
const User = require('./sql/User');
const Route = require('./sql/Route');
const PersonalizedMessage = require('./sql/PersonalizedMessage');
const TouristRegistration = require('./sql/TouristRegistration');

// Models object
const models = {
  User,
  Route,
  PersonalizedMessage,
  TouristRegistration,
  sequelize
};

// Initialize associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;