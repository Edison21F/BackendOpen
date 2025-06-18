const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database.sql');

const Role = sequelize.define('roles', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  display_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_system: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, // System roles cannot be deleted
    comment: 'System roles like admin, user cannot be deleted'
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
  tableName: 'roles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['name'],
      unique: true
    },
    {
      fields: ['is_active']
    }
  ]
});

// Define associations
Role.associate = (models) => {
  // Role has many users through UserRole
  Role.belongsToMany(models.User, {
    through: models.UserRole,
    foreignKey: 'role_id',
    otherKey: 'user_id',
    as: 'users'
  });

  // Role has many permissions through RolePermission
  Role.belongsToMany(models.Permission, {
    through: models.RolePermission,
    foreignKey: 'role_id',
    otherKey: 'permission_id',
    as: 'permissions'
  });

  // Role has many UserRole records
  Role.hasMany(models.UserRole, {
    foreignKey: 'role_id',
    as: 'userRoles'
  });

  // Role has many RolePermission records
  Role.hasMany(models.RolePermission, {
    foreignKey: 'role_id',
    as: 'rolePermissions'
  });
};

module.exports = Role;