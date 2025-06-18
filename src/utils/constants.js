// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// User Roles
const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

// Status Types
const STATUS_TYPES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

// Log Levels
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

// Supported Languages
const SUPPORTED_LANGUAGES = {
  SPANISH: 'es',
  ENGLISH: 'en',
  FRENCH: 'fr',
  GERMAN: 'de',
  ITALIAN: 'it',
  PORTUGUESE: 'pt'
};

// Voice Types
const VOICE_TYPES = {
  MALE: 'male',
  FEMALE: 'female'
};

// Audio Formats
const AUDIO_FORMATS = {
  MP3: 'mp3',
  WAV: 'wav',
  OGG: 'ogg',
  M4A: 'm4a'
};

// Voice Emphasis Levels
const VOICE_EMPHASIS = {
  NONE: 'none',
  MODERATE: 'moderate',
  STRONG: 'strong'
};

// Traffic Congestion Levels
const TRAFFIC_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

// Pagination Defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// Validation Constraints
const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  EMAIL_MAX_LENGTH: 255,
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 15,
  ROUTE_NAME_MIN_LENGTH: 3,
  ROUTE_NAME_MAX_LENGTH: 100,
  LOCATION_MIN_LENGTH: 3,
  LOCATION_MAX_LENGTH: 200,
  MESSAGE_MAX_LENGTH: 2000,
  DESCRIPTION_MAX_LENGTH: 1000,
  COMMENT_MAX_LENGTH: 500,
  SEARCH_MIN_LENGTH: 2,
  SEARCH_MAX_LENGTH: 100
};

// Geographic Constraints
const GEOGRAPHIC = {
  LATITUDE_MIN: -90,
  LATITUDE_MAX: 90,
  LONGITUDE_MIN: -180,
  LONGITUDE_MAX: 180,
  DEFAULT_RADIUS_KM: 10,
  MAX_RADIUS_KM: 100
};

// Voice Settings Constraints
const VOICE_SETTINGS = {
  SPEED_MIN: 0.5,
  SPEED_MAX: 2.0,
  SPEED_DEFAULT: 1.0,
  PITCH_MIN: 0.5,
  PITCH_MAX: 2.0,
  PITCH_DEFAULT: 1.0,
  VOLUME_MIN: 0.1,
  VOLUME_MAX: 2.0,
  VOLUME_DEFAULT: 1.0
};

// Rating Constraints
const RATING = {
  MIN: 1,
  MAX: 5
};

// Time Constraints
const TIME = {
  HOUR_MIN: 0,
  HOUR_MAX: 23,
  DAY_MIN: 0,
  DAY_MAX: 6,
  JWT_EXPIRES_IN: '24h',
  SESSION_TTL: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  PASSWORD_RESET_EXPIRES: 60 * 60 * 1000, // 1 hour in milliseconds
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes in milliseconds
  RATE_LIMIT_MAX: 100 // requests per window
};

// File Upload Constraints
const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_AUDIO_TYPES: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a'],
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
};

// Error Codes
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  ENCRYPTION_ERROR: 'ENCRYPTION_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR'
};

// Success Messages
const SUCCESS_MESSAGES = {
  USER_REGISTERED: 'User registered successfully',
  USER_LOGGED_IN: 'Login successful',
  USER_LOGGED_OUT: 'Logout successful',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  ROUTE_CREATED: 'Route created successfully',
  ROUTE_UPDATED: 'Route updated successfully',
  ROUTE_DELETED: 'Route deleted successfully',
  MESSAGE_CREATED: 'Message created successfully',
  MESSAGE_UPDATED: 'Message updated successfully',
  MESSAGE_DELETED: 'Message deleted successfully',
  TOURIST_CREATED: 'Tourist registration created successfully',
  TOURIST_UPDATED: 'Tourist registration updated successfully',
  TOURIST_DELETED: 'Tourist registration deleted successfully',
  VOICE_GUIDE_CREATED: 'Voice guide created successfully',
  VOICE_GUIDE_UPDATED: 'Voice guide updated successfully',
  VOICE_GUIDE_DELETED: 'Voice guide deleted successfully',
  DATA_RETRIEVED: 'Data retrieved successfully',
  OPERATION_COMPLETED: 'Operation completed successfully'
};

// Error Messages
const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User already exists with this email',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Insufficient permissions',
  INVALID_TOKEN: 'Invalid or expired token',
  VALIDATION_FAILED: 'Validation failed',
  ROUTE_NOT_FOUND: 'Route not found',
  MESSAGE_NOT_FOUND: 'Message not found',
  TOURIST_NOT_FOUND: 'Tourist registration not found',
  VOICE_GUIDE_NOT_FOUND: 'Voice guide not found',
  DATABASE_ERROR: 'Database operation failed',
  INTERNAL_ERROR: 'Internal server error',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
  FILE_TOO_LARGE: 'File size exceeds limit',
  INVALID_FILE_TYPE: 'Invalid file type',
  OPERATION_FAILED: 'Operation failed'
};

// Database Table Names
const TABLES = {
  USERS: 'users',
  ROUTES: 'routes',
  PERSONALIZED_MESSAGES: 'personalized_messages',
  TOURIST_REGISTRATIONS: 'tourist_registrations'
};

// MongoDB Collection Names
const COLLECTIONS = {
  USER_PROFILES: 'user_profiles',
  ROUTE_ANALYTICS: 'route_analytics',
  VOICE_GUIDES: 'voice_guides',
  SYSTEM_LOGS: 'system_logs'
};

// Encryption Constants
const ENCRYPTION = {
  ALGORITHM: 'aes-256-gcm',
  IV_LENGTH: 16,
  SALT_LENGTH: 64,
  TAG_LENGTH: 16,
  PBKDF2_ITERATIONS: 100000,
  BCRYPT_ROUNDS: 12
};

// API Endpoints
const API_ENDPOINTS = {
  AUTH: '/api/auth',
  USERS: '/api/users',
  ROUTES: '/api/routes',
  MESSAGES: '/api/messages',
  TOURIST: '/api/tourist-registrations',
  VOICE_GUIDES: '/api/voice-guides'
};

// Regular Expressions
const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[+]?[0-9]{10,15}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  URL: /^https?:\/\/.+/
};

module.exports = {
  HTTP_STATUS,
  USER_ROLES,
  STATUS_TYPES,
  LOG_LEVELS,
  SUPPORTED_LANGUAGES,
  VOICE_TYPES,
  AUDIO_FORMATS,
  VOICE_EMPHASIS,
  TRAFFIC_LEVELS,
  PAGINATION,
  VALIDATION,
  GEOGRAPHIC,
  VOICE_SETTINGS,
  RATING,
  TIME,
  FILE_UPLOAD,
  ERROR_CODES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  TABLES,
  COLLECTIONS,
  ENCRYPTION,
  API_ENDPOINTS,
  REGEX
};
