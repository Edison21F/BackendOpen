const rbacService = require('../services/rbacService');
const logService = require('../services/logService');

/**
 * Middleware to check if user has required permission
 * @param {string} permission - Required permission (e.g., 'user.create')
 * @param {Object} options - Additional options
 * @returns {Function} - Express middleware function
 */
const requirePermission = (permission, options = {}) => {
  return async (req, res, next) => {
    try {
      const { allowOwner = false, ownerField = 'created_by' } = options;
      
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: {
            type: 'AuthenticationError',
            code: 'AUTHENTICATION_REQUIRED'
          }
        });
      }

      const userId = req.user.id;
      
      // Check if user has the required permission
      const hasPermission = await rbacService.hasPermission(userId, permission);
      
      if (hasPermission) {
        return next();
      }

      // If permission denied but allowOwner is true, check ownership
      if (allowOwner && req.params.id) {
        const resourceId = req.params.id;
        
        // This will be implemented based on the specific resource
        // For now, we'll check if the user is the owner via the ownerField
        if (req.body && req.body[ownerField] === userId) {
          return next();
        }
        
        // Additional ownership check logic can be added here
        // based on the specific resource being accessed
      }

      logService.warn('Permission denied', {
        userId,
        permission,
        resource: req.originalUrl,
        method: req.method,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: {
          type: 'AuthorizationError',
          code: 'PERMISSION_DENIED',
          required_permission: permission
        }
      });
    } catch (error) {
      logService.error('Error in permission check middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during permission check',
        error: {
          type: 'InternalServerError',
          code: 'PERMISSION_CHECK_FAILED'
        }
      });
    }
  };
};

/**
 * Middleware to check if user has any of the required permissions
 * @param {Array<string>} permissions - Array of permissions (user needs at least one)
 * @returns {Function} - Express middleware function
 */
const requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: {
            type: 'AuthenticationError',
            code: 'AUTHENTICATION_REQUIRED'
          }
        });
      }

      const userId = req.user.id;
      
      // Check if user has any of the required permissions
      for (const permission of permissions) {
        const hasPermission = await rbacService.hasPermission(userId, permission);
        if (hasPermission) {
          return next();
        }
      }

      logService.warn('Permission denied - no matching permissions', {
        userId,
        required_permissions: permissions,
        resource: req.originalUrl,
        method: req.method,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: {
          type: 'AuthorizationError',
          code: 'PERMISSION_DENIED',
          required_permissions: permissions
        }
      });
    } catch (error) {
      logService.error('Error in any permission check middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during permission check'
      });
    }
  };
};

/**
 * Middleware to check if user has required role
 * @param {string|Array<string>} roles - Required role(s)
 * @returns {Function} - Express middleware function
 */
const requireRole = (roles) => {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: {
            type: 'AuthenticationError',
            code: 'AUTHENTICATION_REQUIRED'
          }
        });
      }

      const userId = req.user.id;
      const userPermissions = await rbacService.getUserPermissions(userId);
      
      // Check legacy role field for backward compatibility
      if (req.user.rol && roleArray.includes(req.user.rol)) {
        return next();
      }

      // Check if user has role through RBAC system
      const { User, Role, UserRole } = require('../models');
      const user = await User.findByPk(userId, {
        include: [{
          model: Role,
          as: 'roles',
          through: {
            model: UserRole,
            where: { is_active: true }
          }
        }]
      });

      if (user && user.roles) {
        const userRoles = user.roles.map(role => role.name);
        const hasRole = roleArray.some(role => userRoles.includes(role));
        
        if (hasRole) {
          return next();
        }
      }

      logService.warn('Role access denied', {
        userId,
        required_roles: roleArray,
        user_role: req.user.rol,
        resource: req.originalUrl,
        method: req.method,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        message: 'Insufficient role permissions',
        error: {
          type: 'AuthorizationError',
          code: 'ROLE_DENIED',
          required_roles: roleArray
        }
      });
    } catch (error) {
      logService.error('Error in role check middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during role check'
      });
    }
  };
};

/**
 * Middleware to check resource ownership
 * @param {Object} options - Configuration options
 * @returns {Function} - Express middleware function
 */
const requireOwnership = (options = {}) => {
  const { 
    resourceModel, 
    resourceIdParam = 'id', 
    ownerField = 'created_by',
    allowAdmin = true 
  } = options;

  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userId = req.user.id;
      const resourceId = req.params[resourceIdParam];

      // Allow admin to access any resource
      if (allowAdmin && (req.user.rol === 'admin' || req.user.rol === 'super_admin')) {
        return next();
      }

      // Check admin permission through RBAC
      if (allowAdmin) {
        const hasAdminPermission = await rbacService.hasPermission(userId, 'system.admin');
        if (hasAdminPermission) {
          return next();
        }
      }

      if (!resourceModel || !resourceId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid resource configuration'
        });
      }

      // Find the resource and check ownership
      const { [resourceModel]: Model } = require('../models');
      const resource = await Model.findByPk(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      if (resource[ownerField] !== userId) {
        logService.warn('Ownership access denied', {
          userId,
          resourceId,
          resourceModel,
          resource_owner: resource[ownerField],
          ip: req.ip
        });

        return res.status(403).json({
          success: false,
          message: 'Access denied - you do not own this resource',
          error: {
            type: 'AuthorizationError',
            code: 'OWNERSHIP_DENIED'
          }
        });
      }

      // Store resource in request for later use
      req.resource = resource;
      next();
    } catch (error) {
      logService.error('Error in ownership check middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during ownership check'
      });
    }
  };
};

/**
 * Middleware to load user permissions into request
 */
const loadUserPermissions = async (req, res, next) => {
  try {
    if (req.user && req.user.id) {
      req.user.permissions = await rbacService.getUserPermissions(req.user.id);
    }
    next();
  } catch (error) {
    logService.error('Error loading user permissions:', error);
    next(); // Continue without permissions
  }
};

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireRole,
  requireOwnership,
  loadUserPermissions
};