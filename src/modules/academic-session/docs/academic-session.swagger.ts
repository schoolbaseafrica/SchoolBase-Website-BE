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
      description: 'Retrieves all academic sessions.',
      responses: {
        ['200']: {
          description: 'List of academic sessions.',
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
  },
};
