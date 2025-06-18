const express = require('express');
const router = express.Router();
const rbacController = require('../controllers/rbacController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission, requireRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validation');
const Joi = require('joi');

// Validation schemas
const assignRoleSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
  role_name: Joi.string().required()
});

const removeRoleSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
  role_name: Joi.string().required()
});

const checkPermissionSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
  permission: Joi.string().required()
});

const createRoleSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  display_name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  permission_ids: Joi.array().items(Joi.string().uuid()).optional()
});

const updateRoleSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  display_name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).optional(),
  permission_ids: Joi.array().items(Joi.string().uuid()).optional()
});

/**
 * @route   POST /api/rbac/initialize
 * @desc    Initialize RBAC system with default roles and permissions
 * @access  Private (Super Admin only)
 */
router.post('/initialize', 
  authenticateToken,
  requireRole(['super_admin', 'admin']),
  rbacController.initializeRBAC
);

/**
 * @route   GET /api/rbac/roles
 * @desc    Get all roles
 * @access  Private (Role read permission)
 */
router.get('/roles',
  authenticateToken,
  requirePermission('role.read'),
  rbacController.getAllRoles
);

/**
 * @route   GET /api/rbac/roles/:id
 * @desc    Get role by ID
 * @access  Private (Role read permission)
 */
router.get('/roles/:id',
  authenticateToken,
  requirePermission('role.read'),
  rbacController.getRoleById
);

/**
 * @route   POST /api/rbac/roles
 * @desc    Create new role
 * @access  Private (Role create permission)
 */
router.post('/roles',
  authenticateToken,
  requirePermission('role.create'),
  validate(createRoleSchema, 'body'),
  rbacController.createRole
);

/**
 * @route   PUT /api/rbac/roles/:id
 * @desc    Update role
 * @access  Private (Role update permission)
 */
router.put('/roles/:id',
  authenticateToken,
  requirePermission('role.update'),
  validate(updateRoleSchema, 'body'),
  rbacController.updateRole
);

/**
 * @route   DELETE /api/rbac/roles/:id
 * @desc    Delete role
 * @access  Private (Role delete permission)
 */
router.delete('/roles/:id',
  authenticateToken,
  requirePermission('role.delete'),
  rbacController.deleteRole
);

/**
 * @route   GET /api/rbac/permissions
 * @desc    Get all permissions
 * @access  Private (Role read permission)
 */
router.get('/permissions',
  authenticateToken,
  requirePermission('role.read'),
  rbacController.getAllPermissions
);

/**
 * @route   POST /api/rbac/assign-role
 * @desc    Assign role to user
 * @access  Private (Role assign permission)
 */
router.post('/assign-role',
  authenticateToken,
  requirePermission('role.assign'),
  validate(assignRoleSchema, 'body'),
  rbacController.assignRoleToUser
);

/**
 * @route   POST /api/rbac/remove-role
 * @desc    Remove role from user
 * @access  Private (Role assign permission)
 */
router.post('/remove-role',
  authenticateToken,
  requirePermission('role.assign'),
  validate(removeRoleSchema, 'body'),
  rbacController.removeRoleFromUser
);

/**
 * @route   GET /api/rbac/user-permissions/:user_id
 * @desc    Get user permissions
 * @access  Private (User read permission or own profile)
 */
router.get('/user-permissions/:user_id',
  authenticateToken,
  (req, res, next) => {
    // Allow users to check their own permissions
    if (req.user.id === req.params.user_id) {
      return next();
    }
    // Otherwise require permission
    return requirePermission('user.read')(req, res, next);
  },
  rbacController.getUserPermissions
);

/**
 * @route   POST /api/rbac/check-permission
 * @desc    Check if user has specific permission
 * @access  Private (User read permission or own profile)
 */
router.post('/check-permission',
  authenticateToken,
  (req, res, next) => {
    // Allow users to check their own permissions
    if (req.user.id === req.body.user_id) {
      return next();
    }
    // Otherwise require permission
    return requirePermission('user.read')(req, res, next);
  },
  validate(checkPermissionSchema, 'body'),
  rbacController.checkUserPermission
);

module.exports = router;