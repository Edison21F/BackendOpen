const Joi = require('joi');
const logService = require('../services/logService');

/**
 * Generic validation middleware
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate (body, query, params)
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));

      logService.warn('Validation failed', {
        property,
        errors: errorDetails,
        userId: req.user?.id
      });

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorDetails
      });
    }

    // Replace request property with validated value
    req[property] = value;
    next();
  };
};

// User validation schemas
const userSchemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    }),
    nombres: Joi.string().min(2).max(50).required().messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required'
    }),
    apellidos: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required'
    }),
    telefono: Joi.string().pattern(/^[+]?[0-9]{10,15}$/).required().messages({
      'string.pattern.base': 'Please provide a valid phone number',
      'any.required': 'Phone number is required'
    }),
    fecha_nacimiento: Joi.date().max('now').required().messages({
      'date.max': 'Birth date cannot be in the future',
      'any.required': 'Birth date is required'
    }),
    rol: Joi.string().valid('user', 'admin').default('user')
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  }),

  updateProfile: Joi.object({
    nombres: Joi.string().min(2).max(50),
    apellidos: Joi.string().min(2).max(50),
    telefono: Joi.string().pattern(/^[+]?[0-9]{10,15}$/),
    fecha_nacimiento: Joi.date().max('now'),
    preferences: Joi.object({
      language: Joi.string().valid('es', 'en', 'fr', 'de', 'it', 'pt'),
      voice_speed: Joi.number().min(0.5).max(2.0),
      voice_type: Joi.string().valid('male', 'female'),
      notifications_enabled: Joi.boolean(),
      location_sharing: Joi.boolean()
    }),
    accessibility_settings: Joi.object({
      high_contrast: Joi.boolean(),
      large_text: Joi.boolean(),
      voice_guidance: Joi.boolean(),
      vibration_feedback: Joi.boolean()
    })
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Current password is required'
    }),
    newPassword: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required().messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.pattern.base': 'New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      'any.required': 'New password is required'
    }),
    confirmNewPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
      'any.only': 'New passwords do not match',
      'any.required': 'New password confirmation is required'
    })
  })
};

// Route validation schemas
const routeSchemas = {
  create: Joi.object({
    name: Joi.string().min(3).max(100).required().messages({
      'string.min': 'Route name must be at least 3 characters long',
      'string.max': 'Route name cannot exceed 100 characters',
      'any.required': 'Route name is required'
    }),
    location: Joi.string().min(3).max(200).required().messages({
      'string.min': 'Location must be at least 3 characters long',
      'string.max': 'Location cannot exceed 200 characters',
      'any.required': 'Location is required'
    }),
    transport_name: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Transport name must be at least 2 characters long',
      'string.max': 'Transport name cannot exceed 50 characters',
      'any.required': 'Transport name is required'
    }),
    status: Joi.string().valid('active', 'inactive').default('active')
  }),

  update: Joi.object({
    name: Joi.string().min(3).max(100),
    location: Joi.string().min(3).max(200),
    transport_name: Joi.string().min(2).max(50),
    status: Joi.string().valid('active', 'inactive')
  }),

  feedback: Joi.object({
    rating: Joi.number().integer().min(1).max(5).required().messages({
      'number.min': 'Rating must be between 1 and 5',
      'number.max': 'Rating must be between 1 and 5',
      'any.required': 'Rating is required'
    }),
    comment: Joi.string().max(500).messages({
      'string.max': 'Comment cannot exceed 500 characters'
    })
  })
};

// Message validation schemas
const messageSchemas = {
  create: Joi.object({
    message: Joi.string().min(1).max(2000).required().messages({
      'string.min': 'Message cannot be empty',
      'string.max': 'Message cannot exceed 2000 characters',
      'any.required': 'Message is required'
    }),
    route_id: Joi.string().uuid().required().messages({
      'string.uuid': 'Invalid route ID format',
      'any.required': 'Route ID is required'
    }),
    status: Joi.string().valid('active', 'inactive').default('active')
  }),

  update: Joi.object({
    message: Joi.string().min(1).max(2000),
    status: Joi.string().valid('active', 'inactive')
  })
};

// Tourist registration validation schemas
const touristSchemas = {
  create: Joi.object({
    destination_place: Joi.string().min(3).max(100).required().messages({
      'string.min': 'Destination place must be at least 3 characters long',
      'string.max': 'Destination place cannot exceed 100 characters',
      'any.required': 'Destination place is required'
    }),
    name: Joi.string().min(3).max(100).required().messages({
      'string.min': 'Name must be at least 3 characters long',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required'
    }),
    description: Joi.string().max(1000).messages({
      'string.max': 'Description cannot exceed 1000 characters'
    }),
    latitude: Joi.number().min(-90).max(90).messages({
      'number.min': 'Latitude must be between -90 and 90',
      'number.max': 'Latitude must be between -90 and 90'
    }),
    longitude: Joi.number().min(-180).max(180).messages({
      'number.min': 'Longitude must be between -180 and 180',
      'number.max': 'Longitude must be between -180 and 180'
    }),
    status: Joi.string().valid('active', 'inactive').default('active')
  }),

  update: Joi.object({
    destination_place: Joi.string().min(3).max(100),
    name: Joi.string().min(3).max(100),
    description: Joi.string().max(1000),
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180),
    status: Joi.string().valid('active', 'inactive')
  })
};

// Voice guide validation schemas
const voiceGuideSchemas = {
  create: Joi.object({
    route_id: Joi.string().uuid().required().messages({
      'string.uuid': 'Invalid route ID format',
      'any.required': 'Route ID is required'
    }),
    audio_file_url: Joi.string().uri().required().messages({
      'string.uri': 'Invalid audio file URL',
      'any.required': 'Audio file URL is required'
    }),
    language: Joi.string().valid('es', 'en', 'fr', 'de', 'it', 'pt').default('es'),
    transcription: Joi.string().min(1).required().messages({
      'string.min': 'Transcription cannot be empty',
      'any.required': 'Transcription is required'
    }),
    audio_metadata: Joi.object({
      duration: Joi.number().positive().required(),
      format: Joi.string().valid('mp3', 'wav', 'ogg', 'm4a').default('mp3'),
      bitrate: Joi.number().positive(),
      sample_rate: Joi.number().positive(),
      file_size: Joi.number().positive()
    }),
    voice_settings: Joi.object({
      voice_type: Joi.string().valid('male', 'female').default('female'),
      speed: Joi.number().min(0.5).max(2.0).default(1.0),
      pitch: Joi.number().min(0.5).max(2.0).default(1.0),
      volume: Joi.number().min(0.1).max(2.0).default(1.0),
      emphasis: Joi.string().valid('none', 'strong', 'moderate').default('moderate')
    })
  })
};

// Query parameter validation schemas
const querySchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().max(100),
    sort: Joi.string().valid('created_at', 'updated_at', 'name').default('created_at'),
    order: Joi.string().valid('ASC', 'DESC').default('DESC')
  }),

  userQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().max(100),
    role: Joi.string().valid('user', 'admin'),
    isActive: Joi.boolean()
  }),

  routeQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().max(100),
    status: Joi.string().valid('active', 'inactive'),
    createdBy: Joi.string().uuid()
  })
};

// Middleware functions
const validateUserRegistration = validate(userSchemas.register);
const validateUserLogin = validate(userSchemas.login);
const validateUserUpdate = validate(userSchemas.updateProfile);
const validatePasswordChange = validate(userSchemas.changePassword);

const validateRouteCreate = validate(routeSchemas.create);
const validateRouteUpdate = validate(routeSchemas.update);
const validateRouteFeedback = validate(routeSchemas.feedback);

const validateMessageCreate = validate(messageSchemas.create);
const validateMessageUpdate = validate(messageSchemas.update);

const validateTouristCreate = validate(touristSchemas.create);
const validateTouristUpdate = validate(touristSchemas.update);

const validateVoiceGuideCreate = validate(voiceGuideSchemas.create);

const validatePaginationQuery = validate(querySchemas.pagination, 'query');
const validateUserQuery = validate(querySchemas.userQuery, 'query');
const validateRouteQuery = validate(querySchemas.routeQuery, 'query');

/**
 * Custom validation for UUID parameters
 */
const validateUuidParam = (paramName = 'id') => {
  return validate(Joi.object({
    [paramName]: Joi.string().uuid().required().messages({
      'string.uuid': `Invalid ${paramName} format`,
      'any.required': `${paramName} is required`
    })
  }), 'params');
};

module.exports = {
  validate,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validatePasswordChange,
  validateRouteCreate,
  validateRouteUpdate,
  validateRouteFeedback,
  validateMessageCreate,
  validateMessageUpdate,
  validateTouristCreate,
  validateTouristUpdate,
  validateVoiceGuideCreate,
  validatePaginationQuery,
  validateUserQuery,
  validateRouteQuery,
  validateUuidParam
};
