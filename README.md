.
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.js      # MongoDB connection setup
│   │   ├── email.js         # Email service configuration
│   │   ├── redis.js         # Redis client configuration
│   │   └── index.js         # Centralized config exports
│   │
│   ├── controllers/         # Request handlers
│   │   ├── auth.controller.js          # Registration & login
│   │   ├── verification.controller.js  # Email verification
│   │   ├── password.controller.js      # Password reset
│   │   ├── token.controller.js         # Token refresh
│   │   └── health.controller.js        # Health checks
│   │
│   ├── middleware/          # Express middleware
│   │   ├── auth.js          # JWT authentication
│   │   ├── validation.js    # Request validation
│   │   ├── rateLimiter.js   # Rate limiting
│   │   ├── sanitize.js      # Input sanitization
│   │   ├── security.js      # Security headers
│   │   ├── errorHandler.js  # Error handling
│   │   └── requestLogger.js # HTTP logging
│   │
│   ├── models/              # Mongoose schemas
│   │   ├── User.js          # User model
│   │   └── RefreshToken.js  # Refresh token model
│   │
│   ├── routes/              # API routes
│   │   ├── auth.routes.js   # Authentication endpoints
│   │   ├── health.routes.js # Health check endpoints
│   │   └── index.js         # Route aggregation
│   │
│   ├── services/            # Business logic
│   │   ├── auth.service.js          # Authentication logic
│   │   ├── verification.service.js  # Email verification
│   │   ├── password.service.js      # Password operations
│   │   ├── token.service.js         # JWT operations
│   │   ├── email.service.js         # Email sending
│   │   ├── redis.service.js         # Redis operations
│   │   └── cache.service.js         # Caching layer
│   │
│   ├── utils/               # Utility functions
│   │   ├── logger.js        # Winston logger
│   │   ├── tokenGenerator.js # Token generation
│   │   ├── emailTemplates.js # Email HTML templates
│   │   └── asyncHandler.js  # Async error wrapper
│   │
│   ├── validators/          # Joi validation schemas
│   │   ├── auth.validator.js
│   │   └── password.validator.js
│   │
│   ├── app.js               # Express app configuration
│   └── server.js            # Server entry point
│
├── tests/                   # Test suites
│   ├── integration/         # Integration tests
│   │   ├── auth/
│   │   │   ├── register.test.js
│   │   │   ├── login.test.js
│   │   │   ├── logout.test.js
│   │   │   ├── verification.test.js
│   │   │   ├── passwordReset.test.js
│   │   │   └── refreshToken.test.js
│   │   └── middleware/
│   │       └── rateLimiter.test.js
│   │
│   ├── unit/                # Unit tests
│   │   ├── services/
│   │   │   ├── auth.service.test.js
│   │   │   └── email.service.test.js
│   │   ├── validators/
│   │   │   └── auth.validator.test.js
│   │   └── utils/
│   │       └── tokenGenerator.test.js
│   │
│   ├── helpers/             # Test utilities
│   │   ├── testUtils.js     # User creation helpers
│   │   └── mockData.js      # Mock data generators
│   │
│   ├── setup.js             # Jest setup
│   └── teardown.js          # Jest teardown
│
├── docs/                    # Documentation
│   ├── api/
│   │   ├── openapi.yaml     # OpenAPI specification
│   │   ├── swagger.js       # Swagger configuration
│   │   ├── authentication.md
│   │   └── endpoints.md
│   │
│   ├── deployment/
│   │   ├── Dockerfile       # Container image
│   │   └── docker-compose.yml
│   │
│   └── postman/
│       └── collection.json  # Postman collection
│
├── scripts/                 # Utility scripts
│   ├── generateKeys.js      # RSA key generation
│   └── seedDatabase.js      # Database seeding
│
├── .github/
│   └── workflows/
│       └── ci.yml           # CI/CD pipeline
│
├── jest.config.js           # Jest configuration
├── .eslintrc.json           # ESLint rules
├── .prettierrc              # Prettier config
├── .dockerignore
├── .gitignore
├── package.json
└── README.md
