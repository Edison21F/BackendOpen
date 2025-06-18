const { sequelize } = require('../config/database.sql');

// Import all models
const User = require('./sql/User');
const Route = require('./sql/Route');
const PersonalizedMessage = require('./sql/PersonalizedMessage');
const TouristRegistration = require('./sql/TouristRegistration');
const Role = require('./sql/Role');
const Permission = require('./sql/Permission');
const UserRole = require('./sql/UserRole');
const RolePermission = require('./sql/RolePermission');

// Models object
const models = {
  User,
  Route,
  PersonalizedMessage,
  TouristRegistration,
  Role,
  Permission,
  UserRole,
  RolePermission,
  sequelize
};

// Initialize associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;