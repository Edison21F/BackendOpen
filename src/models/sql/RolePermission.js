const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database.sql');

const RolePermission = sequelize.define('role_permissions', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  role_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id'
    }
  },
  permission_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'permissions',
      key: 'id'
    }
  },
  granted_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who granted this permission to the role'
  },
  granted_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
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
  tableName: 'role_permissions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['role_id', 'permission_id'],
      unique: true
    },
    {
      fields: ['role_id']
    },
    {
      fields: ['permission_id']
    }
  ]
});

// Define associations
RolePermission.associate = (models) => {
  // RolePermission belongs to Role
  RolePermission.belongsTo(models.Role, {
    foreignKey: 'role_id',
    as: 'role'
  });

  // RolePermission belongs to Permission
  RolePermission.belongsTo(models.Permission, {
    foreignKey: 'permission_id',
    as: 'permission'
  });

  // RolePermission belongs to User (granted by)
  RolePermission.belongsTo(models.User, {
    foreignKey: 'granted_by',
    as: 'grantedBy'
  });
};

module.exports = RolePermission;