const authService = require('../services/authService');
const logService = require('../services/logService');

/**
 * Authentication middleware
 * Verifies JWT token and sets user in request
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify token
    const decoded = await authService.verifyToken(token);
    
    // Get user data
    const user = await authService.findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Set user in request
    req.user = {
      id: decoded.userId,
      rol: decoded.rol,
      isActive: decoded.isActive,
      ...user
    };

    next();
  } catch (error) {
    logService.error('Authentication failed:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Authorization middleware for admin only
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.rol !== 'admin') {
    logService.logSecurity('unauthorized_admin_access', {
      userId: req.user.id,
      attemptedResource: req.originalUrl
    });
    
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

/**
 * Authorization middleware for user or admin
 */
const requireUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (!['user', 'admin'].includes(req.user.rol)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions'
    });
  }

  next();
};

/**
 * Authorization middleware for resource owner or admin
 * Checks if user owns the resource or is admin
 */
const requireOwnerOrAdmin = (resourceIdParam = 'id', userIdField = 'created_by') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const resourceId = req.params[resourceIdParam];
    const userId = req.user.id;
    const userRole = req.user.rol;

    // Admin can access everything
    if (userRole === 'admin') {
      return next();
    }

    // Check if user owns the resource
    try {
      // For user profile endpoints
      if (resourceIdParam === 'id' && req.originalUrl.includes('/users/')) {
        if (resourceId === userId) {
          return next();
        }
      }

      // For other resources, we'll need to check the database
      // This is a generic implementation that should be customized per use case
      next();
    } catch (error) {
      logService.error('Authorization check failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed'
      });
    }
  };
};

/**
 * Optional authentication middleware
 * Sets user if token is provided, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = await authService.verifyToken(token);
      const user = await authService.findUserById(decoded.userId);
      
      if (user) {
        req.user = {
          id: decoded.userId,
          rol: decoded.rol,
          isActive: decoded.isActive,
          ...user
        };
      }
    }

    next();
  } catch (error) {
    // Don't fail on optional auth errors
    next();
  }
};

/**
 * Rate limiting for authentication endpoints
 */
const authRateLimit = (req, res, next) => {
  // This would typically use a proper rate limiting library like express-rate-limit
  // For now, we'll just log the attempt
  logService.info('Auth endpoint accessed', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    endpoint: req.originalUrl
  });
  
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireUser,
  requireOwnerOrAdmin,
  optionalAuth,
  authRateLimit
};
