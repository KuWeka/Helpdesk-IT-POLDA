const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

/**
 * Swagger API Documentation Configuration
 */

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Helpdesk IT API',
    version: '1.0.0',
    description: 'IT Helpdesk Management System API',
    contact: {
      name: 'API Support',
      email: 'support@helpdesk.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server'
    },
    {
      url: 'https://api.helpdesk.com',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          username: { type: 'string', example: 'johndoe' },
          phone: { type: 'string', example: '+628123456789' },
          role: { type: 'string', enum: ['Admin', 'Teknisi', 'User'], example: 'User' },
          is_active: { type: 'boolean', example: true },
          division_id: { type: 'string', format: 'uuid' },
          language: { type: 'string', enum: ['ID', 'EN'], example: 'ID' },
          theme: { type: 'string', enum: ['light', 'dark'], example: 'light' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      Ticket: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          ticket_number: { type: 'string', example: 'TKT-202604-0001' },
          title: { type: 'string', example: 'Laptop tidak bisa booting' },
          description: { type: 'string', example: 'Laptop tiba-tiba mati dan tidak bisa dinyalakan' },
          status: { type: 'string', enum: ['Open', 'In Progress', 'Resolved', 'Closed'], example: 'Open' },
          category: { type: 'string', example: 'Hardware' },
          user_id: { type: 'string', format: 'uuid' },
          assigned_technician_id: { type: 'string', format: 'uuid' },
          solution: { type: 'string' },
          closed_at: { type: 'string', format: 'date-time' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      Chat: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          ticket_id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          technician_id: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'Diskusi masalah laptop' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['Active', 'Closed'], example: 'Active' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      Message: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          chat_id: { type: 'string', format: 'uuid' },
          sender_id: { type: 'string', format: 'uuid' },
          content: { type: 'string', example: 'Baik, saya akan cek laptop Anda besok' },
          message_type: { type: 'string', enum: ['text', 'image', 'file'], example: 'text' },
          attachment_url: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
          message: { type: 'string', example: 'Operation successful' },
          meta: { type: 'object' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      },
      PaginatedResponse: {
        allOf: [
          { $ref: '#/components/schemas/ApiResponse' },
          {
            type: 'object',
            properties: {
              meta: {
                type: 'object',
                properties: {
                  pagination: {
                    type: 'object',
                    properties: {
                      page: { type: 'integer', example: 1 },
                      perPage: { type: 'integer', example: 20 },
                      total: { type: 'integer', example: 150 },
                      totalPages: { type: 'integer', example: 8 }
                    }
                  }
                }
              }
            }
          }
        ]
      },
      LoginRequest: {
        type: 'object',
        required: ['identifier', 'password'],
        properties: {
          identifier: {
            type: 'string',
            description: 'Email or username',
            example: 'teknisi@test.com'
          },
          password: {
            type: 'string',
            example: 'password123'
          }
        }
      },
      LoginResponse: {
        allOf: [
          { $ref: '#/components/schemas/ApiResponse' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                  refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                  user: { $ref: '#/components/schemas/User' }
                }
              }
            }
          }
        ]
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js', './src/models/*.js'] // Paths to files containing OpenAPI definitions
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec,
  swaggerDefinition
};