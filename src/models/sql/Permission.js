const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database.sql');

const Permission = sequelize.define('permissions', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'Permission identifier (e.g., user.create, route.update)'
  },
  display_name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resource: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Resource type (users, routes, messages, etc.)'
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Action type (create, read, update, delete, manage)'
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
  tableName: 'permissions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['name'],
      unique: true
    },
    {
      fields: ['resource']
    },
    {
      fields: ['action']
    },
    {
      fields: ['resource', 'action']
    }
  ]
});

// Define associations
Permission.associate = (models) => {
  // Permission belongs to many roles through RolePermission
  Permission.belongsToMany(models.Role, {
    through: models.RolePermission,
    foreignKey: 'permission_id',
    otherKey: 'role_id',
    as: 'roles'
  });

  // Permission has many RolePermission records
  Permission.hasMany(models.RolePermission, {
    foreignKey: 'permission_id',
    as: 'rolePermissions'
  });
};

module.exports = Permission;