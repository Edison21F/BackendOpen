const { 
  VALIDATION, 
  GEOGRAPHIC, 
  VOICE_SETTINGS, 
  RATING,
  SUPPORTED_LANGUAGES,
  VOICE_TYPES,
  AUDIO_FORMATS,
  STATUS_TYPES,
  USER_ROLES 
} = require('./constants');
const { 
  isValidEmail, 
  isValidPhone, 
  isValidUUID, 
  isValidURL,
  validatePasswordStrength,
  validateCoordinates 
} = require('./helpers');

/**
 * Validate user registration data
 * @param {Object} userData - User data to validate
 * @returns {Object} - Validation result
 */
const validateUserRegistration = (userData) => {
  const errors = [];
  const { email, password, nombres, apellidos, telefono, fecha_nacimiento, rol } = userData;

  // Email validation
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(email)) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' });
  }

  // Password validation
  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else {
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      passwordValidation.issues.forEach(issue => {
        errors.push({ field: 'password', message: issue });
      });
    }
  }

  // Names validation
  if (!nombres || nombres.trim().length < VALIDATION.NAME_MIN_LENGTH) {
    errors.push({ field: 'nombres', message: `First name must be at least ${VALIDATION.NAME_MIN_LENGTH} characters long` });
  } else if (nombres.length > VALIDATION.NAME_MAX_LENGTH) {
    errors.push({ field: 'nombres', message: `First name cannot exceed ${VALIDATION.NAME_MAX_LENGTH} characters` });
  }

  if (!apellidos || apellidos.trim().length < VALIDATION.NAME_MIN_LENGTH) {
    errors.push({ field: 'apellidos', message: `Last name must be at least ${VALIDATION.NAME_MIN_LENGTH} characters long` });
  } else if (apellidos.length > VALIDATION.NAME_MAX_LENGTH) {
    errors.push({ field: 'apellidos', message: `Last name cannot exceed ${VALIDATION.NAME_MAX_LENGTH} characters` });
  }

  // Phone validation
  if (!telefono) {
    errors.push({ field: 'telefono', message: 'Phone number is required' });
  } else if (!isValidPhone(telefono)) {
    errors.push({ field: 'telefono', message: 'Please provide a valid phone number' });
  }

  // Birth date validation
  if (!fecha_nacimiento) {
    errors.push({ field: 'fecha_nacimiento', message: 'Birth date is required' });
  } else {
    const birthDate = new Date(fecha_nacimiento);
    if (isNaN(birthDate.getTime())) {
      errors.push({ field: 'fecha_nacimiento', message: 'Please provide a valid birth date' });
    } else if (birthDate > new Date()) {
      errors.push({ field: 'fecha_nacimiento', message: 'Birth date cannot be in the future' });
    }
  }

  // Role validation
  if (rol && !Object.values(USER_ROLES).includes(rol)) {
    errors.push({ field: 'rol', message: 'Invalid user role' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate route data
 * @param {Object} routeData - Route data to validate
 * @returns {Object} - Validation result
 */
const validateRouteData = (routeData) => {
  const errors = [];
  const { name, location, transport_name, status } = routeData;

  // Name validation
  if (!name || name.trim().length < VALIDATION.ROUTE_NAME_MIN_LENGTH) {
    errors.push({ field: 'name', message: `Route name must be at least ${VALIDATION.ROUTE_NAME_MIN_LENGTH} characters long` });
  } else if (name.length > VALIDATION.ROUTE_NAME_MAX_LENGTH) {
    errors.push({ field: 'name', message: `Route name cannot exceed ${VALIDATION.ROUTE_NAME_MAX_LENGTH} characters` });
  }

  // Location validation
  if (!location || location.trim().length < VALIDATION.LOCATION_MIN_LENGTH) {
    errors.push({ field: 'location', message: `Location must be at least ${VALIDATION.LOCATION_MIN_LENGTH} characters long` });
  } else if (location.length > VALIDATION.LOCATION_MAX_LENGTH) {
    errors.push({ field: 'location', message: `Location cannot exceed ${VALIDATION.LOCATION_MAX_LENGTH} characters` });
  }

  // Transport name validation
  if (!transport_name || transport_name.trim().length < 2) {
    errors.push({ field: 'transport_name', message: 'Transport name must be at least 2 characters long' });
  } else if (transport_name.length > 50) {
    errors.push({ field: 'transport_name', message: 'Transport name cannot exceed 50 characters' });
  }

  // Status validation
  if (status && !Object.values(STATUS_TYPES).includes(status)) {
    errors.push({ field: 'status', message: 'Invalid status value' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate message data
 * @param {Object} messageData - Message data to validate
 * @returns {Object} - Validation result
 */
const validateMessageData = (messageData) => {
  const errors = [];
  const { message, route_id, status } = messageData;

  // Message validation
  if (!message || message.trim().length === 0) {
    errors.push({ field: 'message', message: 'Message cannot be empty' });
  } else if (message.length > VALIDATION.MESSAGE_MAX_LENGTH) {
    errors.push({ field: 'message', message: `Message cannot exceed ${VALIDATION.MESSAGE_MAX_LENGTH} characters` });
  }

  // Route ID validation
  if (!route_id) {
    errors.push({ field: 'route_id', message: 'Route ID is required' });
  } else if (!isValidUUID(route_id)) {
    errors.push({ field: 'route_id', message: 'Invalid route ID format' });
  }

  // Status validation
  if (status && !Object.values(STATUS_TYPES).includes(status)) {
    errors.push({ field: 'status', message: 'Invalid status value' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate tourist registration data
 * @param {Object} touristData - Tourist data to validate
 * @returns {Object} - Validation result
 */
const validateTouristData = (touristData) => {
  const errors = [];
  const { destination_place, name, description, latitude, longitude, status } = touristData;

  // Destination place validation
  if (!destination_place || destination_place.trim().length < 3) {
    errors.push({ field: 'destination_place', message: 'Destination place must be at least 3 characters long' });
  } else if (destination_place.length > 100) {
    errors.push({ field: 'destination_place', message: 'Destination place cannot exceed 100 characters' });
  }

  // Name validation
  if (!name || name.trim().length < 3) {
    errors.push({ field: 'name', message: 'Name must be at least 3 characters long' });
  } else if (name.length > 100) {
    errors.push({ field: 'name', message: 'Name cannot exceed 100 characters' });
  }

  // Description validation
  if (description && description.length > VALIDATION.DESCRIPTION_MAX_LENGTH) {
    errors.push({ field: 'description', message: `Description cannot exceed ${VALIDATION.DESCRIPTION_MAX_LENGTH} characters` });
  }

  // Coordinates validation
  if (latitude !== undefined || longitude !== undefined) {
    if (latitude === undefined || longitude === undefined) {
      errors.push({ field: 'coordinates', message: 'Both latitude and longitude must be provided' });
    } else {
      const coordValidation = validateCoordinates(latitude, longitude);
      if (!coordValidation.isValid) {
        coordValidation.issues.forEach(issue => {
          errors.push({ field: 'coordinates', message: issue });
        });
      }
    }
  }

  // Status validation
  if (status && !Object.values(STATUS_TYPES).includes(status)) {
    errors.push({ field: 'status', message: 'Invalid status value' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate voice guide data
 * @param {Object} voiceGuideData - Voice guide data to validate
 * @returns {Object} - Validation result
 */
const validateVoiceGuideData = (voiceGuideData) => {
  const errors = [];
  const { 
    route_id, 
    audio_file_url, 
    language, 
    transcription, 
    audio_metadata, 
    voice_settings 
  } = voiceGuideData;

  // Route ID validation
  if (!route_id) {
    errors.push({ field: 'route_id', message: 'Route ID is required' });
  } else if (!isValidUUID(route_id)) {
    errors.push({ field: 'route_id', message: 'Invalid route ID format' });
  }

  // Audio file URL validation
  if (!audio_file_url) {
    errors.push({ field: 'audio_file_url', message: 'Audio file URL is required' });
  } else if (!isValidURL(audio_file_url)) {
    errors.push({ field: 'audio_file_url', message: 'Invalid audio file URL' });
  }

  // Language validation
  if (language && !Object.values(SUPPORTED_LANGUAGES).includes(language)) {
    errors.push({ field: 'language', message: 'Unsupported language' });
  }

  // Transcription validation
  if (!transcription || transcription.trim().length === 0) {
    errors.push({ field: 'transcription', message: 'Transcription is required' });
  }

  // Audio metadata validation
  if (audio_metadata) {
    if (audio_metadata.duration !== undefined && (typeof audio_metadata.duration !== 'number' || audio_metadata.duration <= 0)) {
      errors.push({ field: 'audio_metadata.duration', message: 'Duration must be a positive number' });
    }
    
    if (audio_metadata.format && !Object.values(AUDIO_FORMATS).includes(audio_metadata.format)) {
      errors.push({ field: 'audio_metadata.format', message: 'Invalid audio format' });
    }
  }

  // Voice settings validation
  if (voice_settings) {
    if (voice_settings.voice_type && !Object.values(VOICE_TYPES).includes(voice_settings.voice_type)) {
      errors.push({ field: 'voice_settings.voice_type', message: 'Invalid voice type' });
    }
    
    if (voice_settings.speed !== undefined && (voice_settings.speed < VOICE_SETTINGS.SPEED_MIN || voice_settings.speed > VOICE_SETTINGS.SPEED_MAX)) {
      errors.push({ field: 'voice_settings.speed', message: `Speed must be between ${VOICE_SETTINGS.SPEED_MIN} and ${VOICE_SETTINGS.SPEED_MAX}` });
    }
    
    if (voice_settings.pitch !== undefined && (voice_settings.pitch < VOICE_SETTINGS.PITCH_MIN || voice_settings.pitch > VOICE_SETTINGS.PITCH_MAX)) {
      errors.push({ field: 'voice_settings.pitch', message: `Pitch must be between ${VOICE_SETTINGS.PITCH_MIN} and ${VOICE_SETTINGS.PITCH_MAX}` });
    }
    
    if (voice_settings.volume !== undefined && (voice_settings.volume < VOICE_SETTINGS.VOLUME_MIN || voice_settings.volume > VOICE_SETTINGS.VOLUME_MAX)) {
      errors.push({ field: 'voice_settings.volume', message: `Volume must be between ${VOICE_SETTINGS.VOLUME_MIN} and ${VOICE_SETTINGS.VOLUME_MAX}` });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate feedback data
 * @param {Object} feedbackData - Feedback data to validate
 * @returns {Object} - Validation result
 */
const validateFeedbackData = (feedbackData) => {
  const errors = [];
  const { rating, comment } = feedbackData;

  // Rating validation
  if (!rating) {
    errors.push({ field: 'rating', message: 'Rating is required' });
  } else if (!Number.isInteger(rating) || rating < RATING.MIN || rating > RATING.MAX) {
    errors.push({ field: 'rating', message: `Rating must be an integer between ${RATING.MIN} and ${RATING.MAX}` });
  }

  // Comment validation
  if (comment && comment.length > VALIDATION.COMMENT_MAX_LENGTH) {
    errors.push({ field: 'comment', message: `Comment cannot exceed ${VALIDATION.COMMENT_MAX_LENGTH} characters` });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate user preferences
 * @param {Object} preferences - User preferences to validate
 * @returns {Object} - Validation result
 */
const validateUserPreferences = (preferences) => {
  const errors = [];

  if (preferences.language && !Object.values(SUPPORTED_LANGUAGES).includes(preferences.language)) {
    errors.push({ field: 'preferences.language', message: 'Unsupported language' });
  }

  if (preferences.voice_speed !== undefined && (preferences.voice_speed < VOICE_SETTINGS.SPEED_MIN || preferences.voice_speed > VOICE_SETTINGS.SPEED_MAX)) {
    errors.push({ field: 'preferences.voice_speed', message: `Voice speed must be between ${VOICE_SETTINGS.SPEED_MIN} and ${VOICE_SETTINGS.SPEED_MAX}` });
  }

  if (preferences.voice_type && !Object.values(VOICE_TYPES).includes(preferences.voice_type)) {
    errors.push({ field: 'preferences.voice_type', message: 'Invalid voice type' });
  }

  if (preferences.notifications_enabled !== undefined && typeof preferences.notifications_enabled !== 'boolean') {
    errors.push({ field: 'preferences.notifications_enabled', message: 'Notifications enabled must be a boolean' });
  }

  if (preferences.location_sharing !== undefined && typeof preferences.location_sharing !== 'boolean') {
    errors.push({ field: 'preferences.location_sharing', message: 'Location sharing must be a boolean' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate accessibility settings
 * @param {Object} settings - Accessibility settings to validate
 * @returns {Object} - Validation result
 */
const validateAccessibilitySettings = (settings) => {
  const errors = [];
  const booleanFields = ['high_contrast', 'large_text', 'voice_guidance', 'vibration_feedback'];

  booleanFields.forEach(field => {
    if (settings[field] !== undefined && typeof settings[field] !== 'boolean') {
      errors.push({ field: `accessibility_settings.${field}`, message: `${field} must be a boolean` });
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate location data
 * @param {Object} locationData - Location data to validate
 * @returns {Object} - Validation result
 */
const validateLocationData = (locationData) => {
  const errors = [];
  const { latitude, longitude, accuracy } = locationData;

  if (!latitude || !longitude) {
    errors.push({ field: 'location', message: 'Both latitude and longitude are required' });
  } else {
    const coordValidation = validateCoordinates(latitude, longitude);
    if (!coordValidation.isValid) {
      coordValidation.issues.forEach(issue => {
        errors.push({ field: 'location', message: issue });
      });
    }
  }

  if (accuracy !== undefined && (typeof accuracy !== 'number' || accuracy < 0)) {
    errors.push({ field: 'accuracy', message: 'Accuracy must be a positive number' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate search parameters
 * @param {Object} searchParams - Search parameters to validate
 * @returns {Object} - Validation result
 */
const validateSearchParams = (searchParams) => {
  const errors = [];
  const { q, limit, location, radius } = searchParams;

  if (!q || q.trim().length < VALIDATION.SEARCH_MIN_LENGTH) {
    errors.push({ field: 'q', message: `Search term must be at least ${VALIDATION.SEARCH_MIN_LENGTH} characters long` });
  } else if (q.length > VALIDATION.SEARCH_MAX_LENGTH) {
    errors.push({ field: 'q', message: `Search term cannot exceed ${VALIDATION.SEARCH_MAX_LENGTH} characters` });
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push({ field: 'limit', message: 'Limit must be a number between 1 and 100' });
    }
  }

  if (location && (!location.latitude || !location.longitude)) {
    errors.push({ field: 'location', message: 'Location must include both latitude and longitude' });
  }

  if (radius !== undefined) {
    const radiusNum = parseFloat(radius);
    if (isNaN(radiusNum) || radiusNum < 0 || radiusNum > GEOGRAPHIC.MAX_RADIUS_KM) {
      errors.push({ field: 'radius', message: `Radius must be a number between 0 and ${GEOGRAPHIC.MAX_RADIUS_KM} km` });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateUserRegistration,
  validateRouteData,
  validateMessageData,
  validateTouristData,
  validateVoiceGuideData,
  validateFeedbackData,
  validateUserPreferences,
  validateAccessibilitySettings,
  validateLocationData,
  validateSearchParams
};
