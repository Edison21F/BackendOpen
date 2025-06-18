const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database.sql');

const User = sequelize.define('users', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.TEXT, // Encrypted field
    allowNull: false,
    unique: true
  },
  password_hash: {
    type: DataTypes.TEXT, // Encrypted field
    allowNull: false
  },
  rol: {
    type: DataTypes.ENUM('admin', 'user'),
    defaultValue: 'user',
    allowNull: false
  },
  telefono: {
    type: DataTypes.TEXT, // Encrypted field
    allowNull: true
  },
  nombres: {
    type: DataTypes.TEXT, // Encrypted field
    allowNull: true
  },
  apellidos: {
    type: DataTypes.TEXT, // Encrypted field
    allowNull: true
  },
  fecha_nacimiento: {
    type: DataTypes.TEXT, // Encrypted field
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['email']
    }
  ]
});

// Define associations
User.associate = (models) => {
  // User has many routes
  User.hasMany(models.Route, {
    foreignKey: 'created_by',
    as: 'routes'
  });

  // User has many personalized messages
  User.hasMany(models.PersonalizedMessage, {
    foreignKey: 'created_by',
    as: 'messages'
  });

  // User has many tourist registrations
  User.hasMany(models.TouristRegistration, {
    foreignKey: 'created_by',
    as: 'tourist_registrations'
  });
};

module.exports = User;
