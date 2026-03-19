const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'SENA Agent Referral API',
      version: '1.0.0',
      description: 'API documentation for authentication, activation, agents, customers, and projects.'
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Local development server'
      }
    ],
    tags: [
      { name: 'System', description: 'Health check and utility endpoints' },
      { name: 'Auth', description: 'Authentication and external activation endpoints' },
      { name: 'Agent Types', description: 'Agent type dropdown endpoints' },
      { name: 'Agents', description: 'Agent management endpoints' }
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
        ApiSuccess: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'สำเร็จ' }
          }
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'เกิดข้อผิดพลาด' },
            errorType: { type: 'string', example: 'validation' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@test.com' },
            password: { type: 'string', example: 'password' }
          }
        },
        AgentType: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 6 },
            code: { type: 'string', example: 'general' },
            nameTh: { type: 'string', example: 'บุคคลทั่วไป' },
            sortOrder: { type: 'integer', example: 6 }
          }
        },
        AgentTypesResponse: {
          allOf: [
            { $ref: '#/components/schemas/ApiSuccess' },
            {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/AgentType' }
                }
              }
            }
          ]
        },
        LoginResponse: {
          allOf: [
            { $ref: '#/components/schemas/ApiSuccess' },
            {
              type: 'object',
              properties: {
                data: {
                  type: 'object',
                  properties: {
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer', example: 1 },
                        email: { type: 'string', example: 'admin@test.com' },
                        role: { type: 'string', example: 'admin' },
                        agentId: { type: 'integer', example: 2 },
                        agentCode: { type: 'string', example: 'AG001' },
                        firstName: { type: 'string', example: 'สมชาย' },
                        lastName: { type: 'string', example: 'ใจดี' },
                        agentType: { $ref: '#/components/schemas/AgentType' }
                      }
                    },
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
                  }
                }
              }
            }
          ]
        },
        RegisterAgentRequest: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'idCard'],
          properties: {
            firstName: { type: 'string', example: 'สมชาย' },
            lastName: { type: 'string', example: 'ใจดี' },
            email: { type: 'string', format: 'email', example: 'agent@example.com' },
            phone: { type: 'string', example: '0812345678' },
            idCard: { type: 'string', example: '1234567890123' },
            agentTypeCode: { type: 'string', example: 'general' }
          }
        },
        ActivateRegistrationRequest: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'idCard', 'activationToken', 'consent'],
          properties: {
            firstName: { type: 'string', example: 'Demo' },
            lastName: { type: 'string', example: 'Activation' },
            email: { type: 'string', format: 'email', example: 'activate@example.com' },
            phone: { type: 'string', example: '0812345678' },
            idCard: { type: 'string', example: '1234567890123' },
            agentTypeCode: { type: 'string', example: 'general', description: 'code ของประเภทเอเจนต์ที่เลือกจาก dropdown' },
            userType: { type: 'string', example: 'general', description: 'Alias เดิมที่เว็บภายนอกส่งมาได้' },
            refCode: { type: 'string', example: 'REF-EMAIL' },
            consent: { type: 'boolean', example: true },
            activationToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
          }
        },
        ActivateRegistrationResponse: {
          allOf: [
            { $ref: '#/components/schemas/ApiSuccess' },
            {
              type: 'object',
              properties: {
                data: {
                  type: 'object',
                  properties: {
                    agentCode: { type: 'string', example: 'AG005' },
                    email: { type: 'string', example: 'activate@example.com' },
                    status: { type: 'string', example: 'active' },
                    agentType: { $ref: '#/components/schemas/AgentType' }
                  }
                }
              }
            }
          ]
        },
        MeResponse: {
          allOf: [
            { $ref: '#/components/schemas/ApiSuccess' },
            {
              type: 'object',
              properties: {
                data: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer', example: 4 },
                    email: { type: 'string', example: 'admin@test.com' },
                    role: { type: 'string', example: 'admin' },
                    agentId: { type: 'integer', example: 5 },
                    agentCode: { type: 'string', example: 'AG005' },
                    firstName: { type: 'string', example: 'Demo' },
                    lastName: { type: 'string', example: 'Activation' },
                    status: { type: 'string', example: 'active' },
                    agentType: { $ref: '#/components/schemas/AgentType' }
                  }
                }
              }
            }
          ]
        },
        Agent: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 2 },
            agentCode: { type: 'string', example: 'AG001' },
            idCard: { type: 'string', example: '1234567890123' },
            firstName: { type: 'string', example: 'สมชาย' },
            lastName: { type: 'string', example: 'ใจดี' },
            phone: { type: 'string', example: '0812345678' },
            address: { type: 'string', example: '123 ถนนสุขุมวิท กรุงเทพฯ' },
            registrationDate: { type: 'string', format: 'date', example: '2024-01-01' },
            status: { type: 'string', example: 'active' },
            agentType: { $ref: '#/components/schemas/AgentType' }
          }
        },
        AgentsListResponse: {
          allOf: [
            { $ref: '#/components/schemas/ApiSuccess' },
            {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Agent' }
                },
                pagination: {
                  type: 'object',
                  properties: {
                    current: { type: 'integer', example: 1 },
                    pageSize: { type: 'integer', example: 10 },
                    total: { type: 'integer', example: 3 },
                    totalPages: { type: 'integer', example: 1 }
                  }
                }
              }
            }
          ]
        }
      }
    },
    paths: {
      '/health': {
        get: {
          tags: ['System'],
          summary: 'Health check',
          responses: {
            200: {
              description: 'Server status',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Server is running' },
                      timestamp: { type: 'string', format: 'date-time' },
                      environment: { type: 'string', example: 'development' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api': {
        get: {
          tags: ['System'],
          summary: 'API root information',
          responses: {
            200: {
              description: 'API metadata',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Agent Referral System API - MySQL Edition' },
                      version: { type: 'string', example: '1.0.0' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/test-db': {
        get: {
          tags: ['System'],
          summary: 'Test database connection',
          responses: {
            200: {
              description: 'Database connection success',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiSuccess' }
                }
              }
            },
            500: {
              description: 'Database connection failed',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' }
                }
              }
            }
          }
        }
      },
      '/api/agent-types': {
        get: {
          tags: ['Agent Types'],
          summary: 'Get active agent types for dropdowns',
          responses: {
            200: {
              description: 'Active agent types',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AgentTypesResponse' }
                }
              }
            }
          }
        }
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login with email and password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginRequest' }
              }
            }
          },
          responses: {
            200: {
              description: 'Login success',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LoginResponse' }
                }
              }
            },
            401: {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' }
                }
              }
            }
          }
        }
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user profile',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Current user',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MeResponse' }
                }
              }
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' }
                }
              }
            }
          }
        }
      },
      '/api/auth/register-agent': {
        post: {
          tags: ['Auth'],
          summary: 'Register agent with pending approval flow',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegisterAgentRequest' }
              }
            }
          },
          responses: {
            201: {
              description: 'Agent registered successfully',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiSuccess' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              agentCode: { type: 'string', example: 'AG010' },
                              firstName: { type: 'string', example: 'สมชาย' },
                              lastName: { type: 'string', example: 'ใจดี' },
                              email: { type: 'string', example: 'agent@example.com' },
                              status: { type: 'string', example: 'inactive' }
                            }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            400: {
              description: 'Validation or duplicate data error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' }
                }
              }
            }
          }
        }
      },
      '/api/auth/activate-registration': {
        post: {
          tags: ['Auth'],
          summary: 'Create and activate an account from external email activation flow',
          description: 'External website should call this endpoint after the user clicks the activation link in email.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ActivateRegistrationRequest' }
              }
            }
          },
          responses: {
            201: {
              description: 'Activation success',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ActivateRegistrationResponse' }
                }
              }
            },
            400: {
              description: 'Payload mismatch or validation failure',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' }
                }
              }
            },
            401: {
              description: 'Invalid or expired activation token',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' }
                }
              }
            },
            409: {
              description: 'Duplicate data detected',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' }
                }
              }
            }
          }
        }
      },
      '/api/agents': {
        get: {
          tags: ['Agents'],
          summary: 'Get agents list',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'status', in: 'query', schema: { type: 'string', example: 'active' } },
            { name: 'search', in: 'query', schema: { type: 'string', example: 'AG001' } }
          ],
          responses: {
            200: {
              description: 'Agents list',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AgentsListResponse' }
                }
              }
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' }
                }
              }
            }
          }
        }
      },
      '/api/agents/next-code': {
        get: {
          tags: ['Agents'],
          summary: 'Get next available agent code',
          responses: {
            200: {
              description: 'Next agent code',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          nextAgentCode: { type: 'string', example: 'AG010' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: []
};

module.exports = swaggerJSDoc(options);
