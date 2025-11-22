import * as sysMsg from '../../../constants/system.messages';
import { CreateAcademicSessionDto } from '../dto/create-academic-session.dto';

/**
 * Swagger documentation for Academic Session endpoints.
 *
 * @module AcademicSession
 */

export const AcademicSessionSwagger = {
  tags: ['Academic Session'],
  summary: 'Academic Session Management',
  description:
    'Endpoints for creating, retrieving, updating, and deleting academic sessions.',
  endpoints: {
    create: {
      summary: 'Create Academic Session',
      description:
        'Creates a new academic session. Session name must be unique. Start and end dates must be in the future, and end date must be after start date.',
      requestBody: {
        required: true,
        content: {
          ['application/json']: {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', maxLength: 100, example: '2024/2025' },
                startDate: {
                  type: 'string',
                  format: 'date',
                  example: '2024-09-01',
                },
                endDate: {
                  type: 'string',
                  format: 'date',
                  example: '2025-06-30',
                },
              },
              required: ['name', 'startDate', 'endDate'],
              example: {
                name: '2024/2025',
                startDate: '2024-09-01',
                endDate: '2025-06-30',
              },
            },
          },
        },
      },
      responses: {
        ['201']: {
          description: 'Academic session created successfully.',
          content: {
            ['application/json']: {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  startDate: { type: 'string', format: 'date' },
                  endDate: { type: 'string', format: 'date' },
                  status: { type: 'string', enum: ['Active', 'Inactive'] },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
              example: {
                id: '550e8400-e29b-41d4-a716-446655440000',
                name: '2024/2025',
                startDate: '2024-09-01',
                endDate: '2025-06-30',
                status: 'Inactive',
                createdAt: '2024-01-15T10:30:00Z',
                updatedAt: '2024-01-15T10:30:00Z',
              },
            },
          },
        },
        ['400']: {
          description: 'Invalid date range or date in the past.',
        },
        ['409']: {
          description: 'Session name already exists.',
        },
      },
    },
    findAll: {
      summary: 'Get All Academic Sessions',
      description:
        'Retrieves all academic sessions with pagination support. Defaults to page 1 and limit 20 if not provided.',
      parameters: [
        {
          name: 'page',
          in: 'query',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
          },
          description: 'Page number (defaults to 1)',
          example: 1,
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 20,
          },
          description: 'Number of items per page (defaults to 20)',
          example: 20,
        },
      ],
      responses: {
        ['200']: {
          description: 'Paginated list of academic sessions.',
          content: {
            ['application/json']: {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        startDate: { type: 'string', format: 'date' },
                        endDate: { type: 'string', format: 'date' },
                        status: {
                          type: 'string',
                          enum: ['Active', 'Inactive'],
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                  meta: {
                    type: 'object',
                    properties: {
                      total: {
                        type: 'integer',
                        description: 'Total number of sessions',
                      },
                      limit: { type: 'integer', description: 'Items per page' },
                      page: {
                        type: 'integer',
                        description: 'Current page number',
                      },
                      total_pages: {
                        type: 'integer',
                        description: 'Total number of pages',
                      },
                      has_next: {
                        type: 'boolean',
                        description: 'Whether there is a next page',
                      },
                      has_previous: {
                        type: 'boolean',
                        description: 'Whether there is a previous page',
                      },
                    },
                  },
                },
              },
              example: {
                data: [
                  {
                    id: '550e8400-e29b-41d4-a716-446655440000',
                    name: '2024/2025',
                    startDate: '2024-09-01',
                    endDate: '2025-06-30',
                    status: 'Inactive',
                    createdAt: '2024-01-15T10:30:00Z',
                    updatedAt: '2024-01-15T10:30:00Z',
                  },
                  {
                    id: '660e8400-e29b-41d4-a716-446655440001',
                    name: '2025/2026',
                    startDate: '2025-09-01',
                    endDate: '2026-06-30',
                    status: 'Active',
                    createdAt: '2024-01-15T10:30:00Z',
                    updatedAt: '2024-01-15T10:30:00Z',
                  },
                ],
                meta: {
                  total: 2,
                  limit: 20,
                  page: 1,
                  total_pages: 1,
                  has_next: false,
                  has_previous: false,
                },
              },
            },
          },
        },
      },
    },
    findOne: {
      summary: 'Get Academic Session by ID',
      description: 'Retrieves a single academic session by its ID.',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        ['200']: {
          description: 'Academic session details.',
        },
        ['404']: {
          description: 'Academic session not found.',
        },
      },
    },
    update: {
      summary: 'Update Academic Session',
      description: 'Updates an existing academic session.',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        ['200']: {
          description: 'Academic session updated.',
        },
        ['404']: {
          description: 'Academic session not found.',
        },
      },
    },
    remove: {
      summary: 'Delete Academic Session',
      description: 'Deletes an academic session by its ID.',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        ['200']: {
          description: 'Academic session deleted.',
        },
        ['404']: {
          description: 'Academic session not found.',
        },
      },
    },
    getActiveSession: {
      summary: sysMsg.ACADEMIC_SESSION,
      description: 'Retrieves the currently active academic session.',
      responses: {
        ['200']: {
          description: sysMsg.ACTIVE_ACADEMIC_SESSION_SUCCESS,
        },
        ['404']: {
          description: sysMsg.USER_NOT_FOUND,
        },
        ['401']: {
          description: sysMsg.TOKEN_INVALID,
        },
        ['403']: {
          description: sysMsg.PERMISSION_DENIED,
        },
        ['500']: {
          description: sysMsg.MULTIPLE_ACTIVE_ACADEMIC_SESSION,
        },
      },
    },
    activateSession: {
      summary: 'Activate Academic Session',
      description:
        'Activates a specific academic session by ID. This will deactivate all other sessions and activate the specified one. Only one session can be active at a time.',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'The ID of the academic session to activate',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
      ],
      responses: {
        ['200']: {
          description: 'Session activated successfully.',
          content: {
            ['application/json']: {
              schema: {
                type: 'object',
                properties: {
                  status_code: {
                    type: 'number',
                    example: 200,
                    description: 'HTTP status code',
                  },
                  message: {
                    type: 'string',
                    example: 'Session activated successfully',
                  },
                  data: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      name: { type: 'string' },
                      startDate: { type: 'string', format: 'date' },
                      endDate: { type: 'string', format: 'date' },
                      status: {
                        type: 'string',
                        enum: ['Active', 'Inactive'],
                      },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
              example: {
                status_code: 200,
                message: 'Session activated successfully',
                data: {
                  id: '550e8400-e29b-41d4-a716-446655440000',
                  name: '2024/2025',
                  startDate: '2024-09-01',
                  endDate: '2025-06-30',
                  status: 'Active',
                  createdAt: '2024-01-15T10:30:00Z',
                  updatedAt: '2024-01-15T10:30:00Z',
                },
              },
            },
          },
        },
        ['400']: {
          description: 'Session not found.',
        },
        ['500']: {
          description: 'Activation failed due to server error.',
        },
      },
    },
  },
  decorators: {
    create: {
      operation: {
        summary: 'Create Academic Session',
        description:
          'Creates a new academic session. Session name must be unique. Start and end dates must be in the future, and end date must be after start date.',
      },
      body: {
        type: CreateAcademicSessionDto,
        description: 'Create academic session payload',
        examples: {
          example1: {
            summary: '2024/2025 Academic Session',
            value: {
              name: '2024/2025',
              startDate: '2024-09-01',
              endDate: '2025-06-30',
            },
          },
        },
      },
      response: {
        status: 201,
        description: 'Academic session created successfully.',
      },
    },
    findAll: {
      operation: {
        summary: 'Get All Academic Sessions',
        description:
          'Retrieves all academic sessions with pagination support. Defaults to page 1 and limit 20 if not provided.',
      },
      response: {
        status: 200,
        description: 'Paginated list of academic sessions.',
      },
    },
    activeSession: {
      operation: {
        summary: sysMsg.ACADEMIC_SESSION,
        description:
          'Retrieves the currently active academic session. Ensures only one session is active at a time.',
      },
      response: {
        status: 200,
        description: sysMsg.ACTIVE_ACADEMIC_SESSION_SUCCESS,
      },
      errorResponses: [
        {
          status: 404,
          description: sysMsg.USER_NOT_FOUND,
        },
        {
          status: 401,
          description: sysMsg.TOKEN_INVALID,
        },
        {
          status: 403,
          description: sysMsg.PERMISSION_DENIED,
        },
        {
          status: 500,
          description: sysMsg.MULTIPLE_ACTIVE_ACADEMIC_SESSION,
        },
      ],
    },
    activateSession: {
      operation: {
        summary: 'Activate Academic Session',
        description:
          'Activates a specific academic session by ID. This will deactivate all other sessions and activate the specified one. Only one session can be active at a time.',
      },
      response: {
        status: 200,
        description: 'Session activated successfully.',
      },
      errorResponses: [
        {
          status: 400,
          description: 'Session not found.',
        },
        {
          status: 500,
          description: 'Activation failed due to server error.',
        },
      ],
    },
  },
};
