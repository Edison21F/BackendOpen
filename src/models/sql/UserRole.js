const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database.sql');

const UserRole = sequelize.define('user_roles', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  role_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id'
    }
  },
  assigned_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who assigned this role'
  },
  assigned_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Optional expiration date for temporary role assignments'
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
  tableName: 'user_roles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id', 'role_id'],
      unique: true
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['role_id']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['expires_at']
    }
  ]
});

// Define associations
UserRole.associate = (models) => {
  // UserRole belongs to User
  UserRole.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });

  // UserRole belongs to Role
  UserRole.belongsTo(models.Role, {
    foreignKey: 'role_id',
    as: 'role'
  });

  // UserRole belongs to User (assigned by)
  UserRole.belongsTo(models.User, {
    foreignKey: 'assigned_by',
    as: 'assignedBy'
  });
};

module.exports = UserRole;