# OpenBlind Backend System

## Overview

OpenBlind is a comprehensive backend system designed for accessibility and tourism applications. The system provides voice-guided navigation services with multi-language support, user management, route planning, and personalized messaging capabilities. It's built with a hybrid database architecture using both PostgreSQL for structured data and MongoDB for flexible document storage.

## System Architecture

The application follows a modular Node.js/Express architecture with the following key characteristics:

### Backend Architecture
- **Framework**: Express.js 5.1.0 with modern middleware stack
- **Language**: Node.js with ES6+ features
- **Architecture Pattern**: Service-oriented architecture with controller-service-model separation
- **Security**: JWT-based authentication with field-level encryption for sensitive data
- **API Design**: RESTful API with comprehensive validation and error handling

### Database Strategy
- **Dual Database Approach**: 
  - PostgreSQL (via Sequelize ORM) for structured relational data
  - MongoDB (via Mongoose) for flexible document storage and analytics
- **Data Encryption**: Sensitive user data encrypted at rest using AES-256-GCM
- **Connection Pooling**: Optimized connection management for both databases

## Key Components

### Authentication & Security
- JWT token-based authentication with configurable expiration
- bcrypt password hashing with configurable rounds
- Field-level encryption for PII (email, phone, names, birth date)
- Rate limiting and CORS protection
- Helmet.js security middleware

### User Management
- Role-based access control (admin/user)
- Encrypted user profiles with accessibility preferences
- Login history tracking and session management
- User activity logging for audit trails

### Route & Navigation System
- Route creation and management with location data
- Voice guide integration with multiple audio formats
- Route analytics and usage statistics
- Personalized messaging system for routes

### Tourism Features
- Tourist registration with geolocation support
- Destination management with coordinates
- Multi-language support (Spanish, English, French, German, Italian, Portuguese)
- Voice type preferences (male/female voices)

### Logging & Monitoring
- Winston-based logging with file rotation
- MongoDB-based system log storage
- Performance metrics tracking
- Request/response logging with correlation IDs

## Data Flow

1. **User Registration/Authentication**:
   - User data encrypted before PostgreSQL storage
   - User profile created in MongoDB with preferences
   - JWT token generated for subsequent requests

2. **Route Management**:
   - Route data stored in PostgreSQL
   - Analytics and usage data stored in MongoDB
   - Voice guides linked via route IDs

3. **Voice Guide Processing**:
   - Audio metadata stored in MongoDB
   - File references and user preferences managed
   - Language and voice type selection

4. **Activity Tracking**:
   - All user activities logged to MongoDB
   - Performance metrics captured
   - System logs written to both file and database

## External Dependencies

### Core Dependencies
- **express**: Web framework with compression and security middleware
- **sequelize**: PostgreSQL ORM with connection pooling
- **mongoose**: MongoDB ODM with connection management
- **jsonwebtoken**: JWT authentication implementation
- **bcrypt**: Password hashing
- **joi**: Request validation
- **winston**: Logging framework
- **helmet**: Security middleware
- **cors**: Cross-origin resource sharing
- **express-rate-limit**: Rate limiting protection

### Development Dependencies
- **dotenv**: Environment variable management
- **uuid**: UUID generation for primary keys
- **morgan**: HTTP request logging
- **compression**: Response compression

## Deployment Strategy

The application is configured for Replit deployment with:

- **Runtime**: Node.js 20 with stable Nix packages
- **Port Configuration**: Configurable via environment variables (default: 8000)
- **Database Initialization**: Automatic connection setup for both databases
- **Graceful Shutdown**: Proper cleanup of database connections
- **Environment-based Configuration**: Development/production environment handling
- **Log Management**: File-based logging with rotation in production

The deployment includes automatic package installation and server startup through the configured workflow system.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **June 18, 2025**: Complete RBAC system integrated
  - Role-Based Access Control (RBAC) system fully implemented
  - 6 default roles: super_admin, admin, guide, moderator, tourist, user
  - 33 granular permissions across all resources
  - 84 role-permission assignments configured
  - Advanced middleware for permission checking and resource ownership
  - Complete API endpoints for role and permission management
  - Backward compatibility with existing authentication system
  - PostgreSQL database with all RBAC tables and associations
  - System running successfully on port 5000 with full security

## Changelog

- June 18, 2025. Complete backend implementation and database integration