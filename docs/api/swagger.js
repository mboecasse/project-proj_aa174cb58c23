// File: docs/api/swagger.js
// Generated: 2025-10-08 13:05:13 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_63s6n1xk04bm


const swaggerJsdoc = require('swagger-jsdoc');


const swaggerUi = require('swagger-ui-express');


const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User Authentication API',
      version: '1.0.0',
      description: 'Production-ready authentication API with JWT, email verification, and password reset',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.production.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT access token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User ID'
            },
            name: {
              type: 'string',
              description: 'User full name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            isEmailVerified: {
              type: 'boolean',
              description: 'Email verification status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              description: 'User full name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Valid email address'
            },
            password: {
              type: 'string',
              minLength: 8,
              description: 'Strong password (min 8 characters)'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            password: {
              type: 'string',
              description: 'User password'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User'
                },
                accessToken: {
                  type: 'string',
                  description: 'JWT access token (15m expiry)'
                },
                refreshToken: {
                  type: 'string',
                  description: 'JWT refresh token (7d expiry)'
                }
              }
            },
            message: {
              type: 'string',
              example: 'Login successful'
            }
          }
        },
        ForgotPasswordRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address for password reset'
            }
          }
        },
        ResetPasswordRequest: {
          type: 'object',
          required: ['token', 'password'],
          properties: {
            token: {
              type: 'string',
              description: 'Password reset token from email'
            },
            password: {
              type: 'string',
              minLength: 8,
              description: 'New password (min 8 characters)'
            }
          }
        },
        RefreshTokenRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              description: 'Valid refresh token'
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation successful'
            },
            data: {
              type: 'object',
              description: 'Response data (varies by endpoint)'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Error message'
            }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'email'
                  },
                  message: {
                    type: 'string',
                    example: 'Invalid email format'
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                error: 'Unauthorized - Invalid or expired token'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                error: 'Forbidden - Insufficient permissions'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                error: 'Resource not found'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationError'
              }
            }
          }
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                error: 'Internal server error'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints (register, login, logout)'
      },
      {
        name: 'Email Verification',
        description: 'Email verification and resend verification email'
      },
      {
        name: 'Password Reset',
        description: 'Password reset flow (request and reset)'
      },
      {
        name: 'Token Management',
        description: 'Token refresh and validation'
      },
      {
        name: 'User Profile',
        description: 'User profile management'
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};


const swaggerSpec = swaggerJsdoc(options);


const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Authentication API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
    docExpansion: 'none',
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1
  }
};


const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));

  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

module.exports = { setupSwagger, swaggerSpec };
