const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database.sql');

const PersonalizedMessage = sequelize.define('personalized_messages', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  message: {
    type: DataTypes.TEXT, // Encrypted field
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  route_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'routes',
      key: 'id'
    }
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
  tableName: 'personalized_messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['route_id']
    },
    {
      fields: ['created_by']
    },
    {
      fields: ['status']
    }
  ]
});

// Define associations
PersonalizedMessage.associate = (models) => {
  // Message belongs to Route
  PersonalizedMessage.belongsTo(models.Route, {
    foreignKey: 'route_id',
    as: 'route'
  });

  // Message belongs to User
  PersonalizedMessage.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });
};

module.exports = PersonalizedMessage;
