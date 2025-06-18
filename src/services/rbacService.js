const { Role, Permission, User, UserRole, RolePermission } = require('../models');
const logService = require('./logService');
const { Op } = require('sequelize');

class RBACService {
  /**
   * Initialize default roles and permissions
   */
  async initializeDefaultRoles() {
    try {
      // Default roles
      const defaultRoles = [
        {
          name: 'super_admin',
          display_name: 'Super Administrator',
          description: 'Full system access with all permissions',
          is_system: true
        },
        {
          name: 'admin',
          display_name: 'Administrator',
          description: 'System administrator with management permissions',
          is_system: true
        },
        {
          name: 'guide',
          display_name: 'Tour Guide',
          description: 'Can create and manage routes and voice guides',
          is_system: true
        },
        {
          name: 'moderator',
          display_name: 'Content Moderator',
          description: 'Can moderate content and manage user reports',
          is_system: true
        },
        {
          name: 'tourist',
          display_name: 'Tourist',
          description: 'Tourist with basic access to view and use routes',
          is_system: true
        },
        {
          name: 'user',
          display_name: 'Regular User',
          description: 'Standard user with basic permissions',
          is_system: true
        }
      ];

      // Create roles if they don't exist
      for (const roleData of defaultRoles) {
        await Role.findOrCreate({
          where: { name: roleData.name },
          defaults: roleData
        });
      }

      logService.info('Default roles initialized successfully');
    } catch (error) {
      logService.error('Error initializing default roles:', error);
      throw error;
    }
  }

  /**
   * Initialize default permissions
   */
  async initializeDefaultPermissions() {
    try {
      const defaultPermissions = [
        // User permissions
        { name: 'user.create', display_name: 'Create Users', resource: 'users', action: 'create' },
        { name: 'user.read', display_name: 'View Users', resource: 'users', action: 'read' },
        { name: 'user.update', display_name: 'Update Users', resource: 'users', action: 'update' },
        { name: 'user.delete', display_name: 'Delete Users', resource: 'users', action: 'delete' },
        { name: 'user.manage', display_name: 'Manage All Users', resource: 'users', action: 'manage' },

        // Route permissions
        { name: 'route.create', display_name: 'Create Routes', resource: 'routes', action: 'create' },
        { name: 'route.read', display_name: 'View Routes', resource: 'routes', action: 'read' },
        { name: 'route.update', display_name: 'Update Routes', resource: 'routes', action: 'update' },
        { name: 'route.delete', display_name: 'Delete Routes', resource: 'routes', action: 'delete' },
        { name: 'route.manage', display_name: 'Manage All Routes', resource: 'routes', action: 'manage' },

        // Message permissions
        { name: 'message.create', display_name: 'Create Messages', resource: 'messages', action: 'create' },
        { name: 'message.read', display_name: 'View Messages', resource: 'messages', action: 'read' },
        { name: 'message.update', display_name: 'Update Messages', resource: 'messages', action: 'update' },
        { name: 'message.delete', display_name: 'Delete Messages', resource: 'messages', action: 'delete' },
        { name: 'message.manage', display_name: 'Manage All Messages', resource: 'messages', action: 'manage' },

        // Tourist registration permissions
        { name: 'tourist.create', display_name: 'Create Tourist Registrations', resource: 'tourist', action: 'create' },
        { name: 'tourist.read', display_name: 'View Tourist Registrations', resource: 'tourist', action: 'read' },
        { name: 'tourist.update', display_name: 'Update Tourist Registrations', resource: 'tourist', action: 'update' },
        { name: 'tourist.delete', display_name: 'Delete Tourist Registrations', resource: 'tourist', action: 'delete' },
        { name: 'tourist.manage', display_name: 'Manage All Tourist Registrations', resource: 'tourist', action: 'manage' },

        // Voice guide permissions
        { name: 'voice_guide.create', display_name: 'Create Voice Guides', resource: 'voice_guides', action: 'create' },
        { name: 'voice_guide.read', display_name: 'View Voice Guides', resource: 'voice_guides', action: 'read' },
        { name: 'voice_guide.update', display_name: 'Update Voice Guides', resource: 'voice_guides', action: 'update' },
        { name: 'voice_guide.delete', display_name: 'Delete Voice Guides', resource: 'voice_guides', action: 'delete' },
        { name: 'voice_guide.manage', display_name: 'Manage All Voice Guides', resource: 'voice_guides', action: 'manage' },

        // System permissions
        { name: 'system.admin', display_name: 'System Administration', resource: 'system', action: 'admin' },
        { name: 'system.logs', display_name: 'View System Logs', resource: 'system', action: 'logs' },
        { name: 'system.analytics', display_name: 'View Analytics', resource: 'system', action: 'analytics' },

        // Role management permissions
        { name: 'role.create', display_name: 'Create Roles', resource: 'roles', action: 'create' },
        { name: 'role.read', display_name: 'View Roles', resource: 'roles', action: 'read' },
        { name: 'role.update', display_name: 'Update Roles', resource: 'roles', action: 'update' },
        { name: 'role.delete', display_name: 'Delete Roles', resource: 'roles', action: 'delete' },
        { name: 'role.assign', display_name: 'Assign Roles to Users', resource: 'roles', action: 'assign' }
      ];

      // Create permissions if they don't exist
      for (const permData of defaultPermissions) {
        await Permission.findOrCreate({
          where: { name: permData.name },
          defaults: {
            ...permData,
            description: `Permission to ${permData.action} ${permData.resource}`
          }
        });
      }

      logService.info('Default permissions initialized successfully');
    } catch (error) {
      logService.error('Error initializing default permissions:', error);
      throw error;
    }
  }

  /**
   * Assign default permissions to roles
   */
  async assignDefaultRolePermissions() {
    try {
      // Super Admin - all permissions
      const superAdminRole = await Role.findOne({ where: { name: 'super_admin' } });
      const allPermissions = await Permission.findAll({ where: { is_active: true } });
      if (superAdminRole) {
        await superAdminRole.setPermissions(allPermissions);
      }

      // Admin - management permissions
      const adminRole = await Role.findOne({ where: { name: 'admin' } });
      const adminPermissions = await Permission.findAll({
        where: {
          name: {
            [Op.in]: [
              'user.read', 'user.update', 'user.manage',
              'route.read', 'route.update', 'route.manage',
              'message.read', 'message.update', 'message.manage',
              'tourist.read', 'tourist.update', 'tourist.manage',
              'voice_guide.read', 'voice_guide.update', 'voice_guide.manage',
              'system.logs', 'system.analytics',
              'role.read', 'role.assign'
            ]
          }
        }
      });
      if (adminRole) {
        await adminRole.setPermissions(adminPermissions);
      }

      // Guide - route and voice guide permissions
      const guideRole = await Role.findOne({ where: { name: 'guide' } });
      const guidePermissions = await Permission.findAll({
        where: {
          name: {
            [Op.in]: [
              'route.create', 'route.read', 'route.update', 'route.delete',
              'voice_guide.create', 'voice_guide.read', 'voice_guide.update', 'voice_guide.delete',
              'message.create', 'message.read', 'message.update', 'message.delete',
              'tourist.read'
            ]
          }
        }
      });
      if (guideRole) {
        await guideRole.setPermissions(guidePermissions);
      }

      // Moderator - content moderation permissions
      const moderatorRole = await Role.findOne({ where: { name: 'moderator' } });
      const moderatorPermissions = await Permission.findAll({
        where: {
          name: {
            [Op.in]: [
              'route.read', 'route.update',
              'message.read', 'message.update', 'message.delete',
              'tourist.read', 'tourist.update',
              'voice_guide.read', 'voice_guide.update',
              'user.read'
            ]
          }
        }
      });
      if (moderatorRole) {
        await moderatorRole.setPermissions(moderatorPermissions);
      }

      // Tourist - basic tourist permissions
      const touristRole = await Role.findOne({ where: { name: 'tourist' } });
      const touristPermissions = await Permission.findAll({
        where: {
          name: {
            [Op.in]: [
              'route.read',
              'voice_guide.read',
              'tourist.create', 'tourist.read', 'tourist.update',
              'message.read'
            ]
          }
        }
      });
      if (touristRole) {
        await touristRole.setPermissions(touristPermissions);
      }

      // User - basic user permissions
      const userRole = await Role.findOne({ where: { name: 'user' } });
      const userPermissions = await Permission.findAll({
        where: {
          name: {
            [Op.in]: [
              'route.read',
              'voice_guide.read',
              'message.read'
            ]
          }
        }
      });
      if (userRole) {
        await userRole.setPermissions(userPermissions);
      }

      logService.info('Default role permissions assigned successfully');
    } catch (error) {
      logService.error('Error assigning default role permissions:', error);
      throw error;
    }
  }

  /**
   * Check if user has specific permission
   * @param {string} userId - User ID
   * @param {string} permissionName - Permission name (e.g., 'user.create')
   * @returns {Promise<boolean>} - Whether user has permission
   */
  async hasPermission(userId, permissionName) {
    try {
      const user = await User.findByPk(userId, {
        include: [{
          model: Role,
          as: 'roles',
          through: {
            model: UserRole,
            where: { is_active: true }
          },
          include: [{
            model: Permission,
            as: 'permissions',
            where: { 
              name: permissionName,
              is_active: true 
            }
          }]
        }]
      });

      if (!user) return false;

      // Check if user has any role with the required permission
      return user.roles && user.roles.length > 0 && 
             user.roles.some(role => role.permissions && role.permissions.length > 0);

    } catch (error) {
      logService.error('Error checking user permission:', error);
      return false;
    }
  }

  /**
   * Get all permissions for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of permission names
   */
  async getUserPermissions(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: [{
          model: Role,
          as: 'roles',
          through: {
            model: UserRole,
            where: { is_active: true }
          },
          include: [{
            model: Permission,
            as: 'permissions',
            where: { is_active: true }
          }]
        }]
      });

      if (!user || !user.roles) return [];

      const permissions = new Set();
      user.roles.forEach(role => {
        if (role.permissions) {
          role.permissions.forEach(permission => {
            permissions.add(permission.name);
          });
        }
      });

      return Array.from(permissions);
    } catch (error) {
      logService.error('Error getting user permissions:', error);
      return [];
    }
  }

  /**
   * Assign role to user
   * @param {string} userId - User ID
   * @param {string} roleName - Role name
   * @param {string} assignedBy - ID of user assigning the role
   * @returns {Promise<Object>} - UserRole record
   */
  async assignRole(userId, roleName, assignedBy) {
    try {
      const role = await Role.findOne({ where: { name: roleName, is_active: true } });
      if (!role) {
        throw new Error(`Role '${roleName}' not found`);
      }

      const existingUserRole = await UserRole.findOne({
        where: { user_id: userId, role_id: role.id }
      });

      if (existingUserRole) {
        // Reactivate if inactive
        if (!existingUserRole.is_active) {
          await existingUserRole.update({ 
            is_active: true,
            assigned_by: assignedBy,
            assigned_at: new Date()
          });
          return existingUserRole;
        }
        throw new Error('User already has this role');
      }

      const userRole = await UserRole.create({
        user_id: userId,
        role_id: role.id,
        assigned_by: assignedBy
      });

      logService.info('Role assigned to user', { userId, roleName, assignedBy });
      return userRole;
    } catch (error) {
      logService.error('Error assigning role to user:', error);
      throw error;
    }
  }

  /**
   * Remove role from user
   * @param {string} userId - User ID
   * @param {string} roleName - Role name
   * @returns {Promise<boolean>} - Success status
   */
  async removeRole(userId, roleName) {
    try {
      const role = await Role.findOne({ where: { name: roleName } });
      if (!role) {
        throw new Error(`Role '${roleName}' not found`);
      }

      const userRole = await UserRole.findOne({
        where: { user_id: userId, role_id: role.id, is_active: true }
      });

      if (!userRole) {
        throw new Error('User does not have this role');
      }

      await userRole.update({ is_active: false });
      logService.info('Role removed from user', { userId, roleName });
      return true;
    } catch (error) {
      logService.error('Error removing role from user:', error);
      throw error;
    }
  }

  /**
   * Initialize complete RBAC system
   */
  async initializeRBAC() {
    try {
      await this.initializeDefaultRoles();
      await this.initializeDefaultPermissions();
      await this.assignDefaultRolePermissions();
      
      logService.info('RBAC system initialized successfully');
      return true;
    } catch (error) {
      logService.error('Error initializing RBAC system:', error);
      throw error;
    }
  }
}

module.exports = new RBACService();