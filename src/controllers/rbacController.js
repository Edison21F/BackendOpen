const rbacService = require('../services/rbacService');
const { Role, Permission, User, UserRole, RolePermission } = require('../models');
const logService = require('../services/logService');
const { Op } = require('sequelize');

class RBACController {
  /**
   * Initialize RBAC system
   */
  async initializeRBAC(req, res) {
    try {
      await rbacService.initializeRBAC();
      
      res.status(200).json({
        success: true,
        message: 'RBAC system initialized successfully',
        data: {
          status: 'initialized',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logService.error('Error in initializeRBAC:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to initialize RBAC system'
      });
    }
  }

  /**
   * Get all roles
   */
  async getAllRoles(req, res) {
    try {
      const { page = 1, limit = 10, search, is_active } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { display_name: { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      if (typeof is_active === 'string') {
        whereClause.is_active = is_active === 'true';
      }

      const { count, rows } = await Role.findAndCountAll({
        where: whereClause,
        include: [{
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'name', 'display_name', 'resource', 'action'],
          through: { attributes: [] }
        }],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        message: 'Roles retrieved successfully',
        data: {
          roles: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logService.error('Error in getAllRoles:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve roles'
      });
    }
  }

  /**
   * Get role by ID
   */
  async getRoleById(req, res) {
    try {
      const { id } = req.params;
      
      const role = await Role.findByPk(id, {
        include: [{
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'name', 'display_name', 'resource', 'action', 'description'],
          through: { attributes: ['granted_at'] }
        }]
      });

      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Role retrieved successfully',
        data: { role }
      });
    } catch (error) {
      logService.error('Error in getRoleById:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve role'
      });
    }
  }

  /**
   * Create new role
   */
  async createRole(req, res) {
    try {
      const { name, display_name, description, permission_ids = [] } = req.body;
      const userId = req.user.id;

      // Check if role already exists
      const existingRole = await Role.findOne({ where: { name } });
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: 'Role with this name already exists'
        });
      }

      // Create role
      const role = await Role.create({
        name,
        display_name,
        description,
        is_system: false
      });

      // Assign permissions if provided
      if (permission_ids.length > 0) {
        const permissions = await Permission.findAll({
          where: { id: { [Op.in]: permission_ids }, is_active: true }
        });
        
        await role.setPermissions(permissions);
        
        // Log permission grants
        for (const permission of permissions) {
          await RolePermission.update(
            { granted_by: userId },
            { where: { role_id: role.id, permission_id: permission.id } }
          );
        }
      }

      // Fetch role with permissions for response
      const createdRole = await Role.findByPk(role.id, {
        include: [{
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'name', 'display_name', 'resource', 'action'],
          through: { attributes: [] }
        }]
      });

      logService.info('Role created', { roleId: role.id, roleName: name, userId });

      res.status(201).json({
        success: true,
        message: 'Role created successfully',
        data: { role: createdRole }
      });
    } catch (error) {
      logService.error('Error in createRole:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create role'
      });
    }
  }

  /**
   * Update role
   */
  async updateRole(req, res) {
    try {
      const { id } = req.params;
      const { name, display_name, description, permission_ids } = req.body;
      const userId = req.user.id;

      const role = await Role.findByPk(id);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Prevent modification of system roles
      if (role.is_system) {
        return res.status(400).json({
          success: false,
          message: 'Cannot modify system roles'
        });
      }

      // Update role details
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (display_name !== undefined) updateData.display_name = display_name;
      if (description !== undefined) updateData.description = description;

      await role.update(updateData);

      // Update permissions if provided
      if (permission_ids !== undefined) {
        const permissions = await Permission.findAll({
          where: { id: { [Op.in]: permission_ids }, is_active: true }
        });
        
        await role.setPermissions(permissions);
        
        // Update granted_by for new permissions
        for (const permission of permissions) {
          await RolePermission.update(
            { granted_by: userId },
            { where: { role_id: role.id, permission_id: permission.id } }
          );
        }
      }

      // Fetch updated role with permissions
      const updatedRole = await Role.findByPk(id, {
        include: [{
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'name', 'display_name', 'resource', 'action'],
          through: { attributes: [] }
        }]
      });

      logService.info('Role updated', { roleId: id, userId, fields: Object.keys(updateData) });

      res.status(200).json({
        success: true,
        message: 'Role updated successfully',
        data: { role: updatedRole }
      });
    } catch (error) {
      logService.error('Error in updateRole:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update role'
      });
    }
  }

  /**
   * Delete role
   */
  async deleteRole(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const role = await Role.findByPk(id);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Prevent deletion of system roles
      if (role.is_system) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete system roles'
        });
      }

      // Check if role is assigned to any users
      const userCount = await UserRole.count({
        where: { role_id: id, is_active: true }
      });

      if (userCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete role: ${userCount} users are assigned to this role`
        });
      }

      await role.destroy();
      logService.info('Role deleted', { roleId: id, roleName: role.name, userId });

      res.status(200).json({
        success: true,
        message: 'Role deleted successfully'
      });
    } catch (error) {
      logService.error('Error in deleteRole:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete role'
      });
    }
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(req, res) {
    try {
      const { page = 1, limit = 50, resource, action } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = { is_active: true };
      
      if (resource) {
        whereClause.resource = resource;
      }
      
      if (action) {
        whereClause.action = action;
      }

      const { count, rows } = await Permission.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['resource', 'ASC'], ['action', 'ASC']]
      });

      res.status(200).json({
        success: true,
        message: 'Permissions retrieved successfully',
        data: {
          permissions: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logService.error('Error in getAllPermissions:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve permissions'
      });
    }
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(req, res) {
    try {
      const { user_id, role_name } = req.body;
      const assignedBy = req.user.id;

      const userRole = await rbacService.assignRole(user_id, role_name, assignedBy);

      res.status(200).json({
        success: true,
        message: 'Role assigned to user successfully',
        data: { userRole }
      });
    } catch (error) {
      logService.error('Error in assignRoleToUser:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to assign role to user'
      });
    }
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(req, res) {
    try {
      const { user_id, role_name } = req.body;

      await rbacService.removeRole(user_id, role_name);

      res.status(200).json({
        success: true,
        message: 'Role removed from user successfully'
      });
    } catch (error) {
      logService.error('Error in removeRoleFromUser:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to remove role from user'
      });
    }
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(req, res) {
    try {
      const { user_id } = req.params;

      const permissions = await rbacService.getUserPermissions(user_id);

      res.status(200).json({
        success: true,
        message: 'User permissions retrieved successfully',
        data: { 
          user_id,
          permissions 
        }
      });
    } catch (error) {
      logService.error('Error in getUserPermissions:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve user permissions'
      });
    }
  }

  /**
   * Check user permission
   */
  async checkUserPermission(req, res) {
    try {
      const { user_id, permission } = req.body;

      const hasPermission = await rbacService.hasPermission(user_id, permission);

      res.status(200).json({
        success: true,
        message: 'Permission check completed',
        data: { 
          user_id,
          permission,
          has_permission: hasPermission
        }
      });
    } catch (error) {
      logService.error('Error in checkUserPermission:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to check user permission'
      });
    }
  }
}

module.exports = new RBACController();