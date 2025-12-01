import { HttpStatus } from '@nestjs/common';

import * as sysMsg from '../../../constants/system.messages';
import { AcademicSessionResponseDto } from '../dto/academic-session-response.dto';

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
      operation: {
        summary: 'Create Academic Session (Admin)',
        description:
          'Creates a new academic session with exactly 3 terms. Session name (academic year) must be unique. The session start date is the start of the first term, and the end date is the end of the third term. Active sessions cannot overlap.',
      },
      responses: {
        created: {
          status: HttpStatus.CREATED,
          description: sysMsg.ACADEMIC_SESSION_CREATED,
          type: AcademicSessionResponseDto,
        },
        badRequest: {
          status: HttpStatus.BAD_REQUEST,
          description:
            'Validation failed: dates invalid, terms not sequential, or other business rules failed.',
        },
        conflict: {
          status: HttpStatus.CONFLICT,
          description:
            'Conflict occurred: session with same academic year exists or ongoing session already active.',
        },
      },
    },
    findAll: {
      operation: {
        summary: 'Get All Academic Sessions (Admin)',
        description:
          'Retrieves all academic sessions with pagination support. Defaults to page 1 and limit 20 if not provided.',
      },
      parameters: {
        page: {
          name: 'page',
          required: false,
          type: Number,
          description: 'Page number (defaults to 1)',
          example: 1,
        },
        limit: {
          name: 'limit',
          required: false,
          type: Number,
          description: 'Number of items per page (defaults to 20)',
          example: 20,
        },
      },
      responses: {
        ok: {
          status: HttpStatus.OK,
          description: 'Academic sessions retrieved successfully',
          type: AcademicSessionResponseDto,
          isArray: true,
        },
      },
    },
    findOne: {
      operation: {
        summary: 'Get Academic Session by ID (Admin)',
        description:
          'Retrieves a single academic session by its ID including all associated terms.',
      },
      parameters: {
        id: {
          name: 'id',
          description: 'The UUID of the academic session',
          type: 'string',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
      },
      responses: {
        ok: {
          status: HttpStatus.OK,
          description: 'Academic session retrieved successfully',
          type: AcademicSessionResponseDto,
        },
        notFound: {
          status: HttpStatus.NOT_FOUND,
          description: 'Academic session not found',
        },
      },
    },
    update: {
      operation: {
        summary: 'Update Academic Session (Admin)',
        description:
          'Updates an existing academic session. Can update description and status.',
      },
      parameters: {
        id: {
          name: 'id',
          description: 'The UUID of the academic session',
          type: 'string',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
      },
      responses: {
        ok: {
          status: HttpStatus.OK,
          description: 'Academic session updated successfully',
          type: AcademicSessionResponseDto,
        },
        badRequest: {
          status: HttpStatus.BAD_REQUEST,
          description: 'Validation failed',
        },
        notFound: {
          status: HttpStatus.NOT_FOUND,
          description: 'Academic session not found',
        },
      },
    },
    remove: {
      operation: {
        summary: 'Delete Academic Session (Admin)',
        description: 'Soft deletes an academic session by its ID.',
      },
      parameters: {
        id: {
          name: 'id',
          description: 'The UUID of the academic session',
          type: 'string',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
      },
      responses: {
        ok: {
          status: HttpStatus.OK,
          description: 'Academic session deleted successfully',
        },
        notFound: {
          status: HttpStatus.NOT_FOUND,
          description: 'Academic session not found',
        },
      },
    },
    activeSession: {
      operation: {
        summary: 'Get Active Academic Session (Admin)',
        description:
          'Retrieves the currently active academic session. Only one session can be active at a time based on current date falling within session date range.',
      },
      responses: {
        ok: {
          status: HttpStatus.OK,
          description: sysMsg.ACTIVE_ACADEMIC_SESSION_SUCCESS,
          type: AcademicSessionResponseDto,
        },
        notFound: {
          status: HttpStatus.NOT_FOUND,
          description: 'No active academic session found',
        },
      },
    },
  },
};
