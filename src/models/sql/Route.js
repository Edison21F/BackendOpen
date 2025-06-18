const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database.sql');

const Route = sequelize.define('routes', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  transport_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
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
  tableName: 'routes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['created_by']
    },
    {
      fields: ['status']
    }
  ]
});

// Define associations
Route.associate = (models) => {
  // Route belongs to User
  Route.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });

  // Route has many personalized messages
  Route.hasMany(models.PersonalizedMessage, {
    foreignKey: 'route_id',
    as: 'messages'
  });
};

module.exports = Route;
