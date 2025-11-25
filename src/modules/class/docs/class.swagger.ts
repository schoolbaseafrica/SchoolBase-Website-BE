import { HttpStatus } from '@nestjs/common';

import * as sysMsg from '../../../constants/system.messages';
import { CreateClassDto } from '../dto/create-class.dto';
import { TeacherAssignmentResponseDto } from '../dto/teacher-response.dto';

/**
 * Swagger documentation for Class endpoints.
 *
 * @module Class
 */

export const ClassSwagger = {
  tags: ['Classes'],
  summary: 'Class Management',
  description:
    'Endpoints for creating, retrieving, updating, and deleting academic sessions.',
  endpoints: {
    getTeachers: {
      operation: {
        summary: 'Get teachers assigned to a class',
        description:
          'Returns a list of teachers assigned to a specific class ID. Filters by session if provided, otherwise uses current session.',
      },
      parameters: {
        id: {
          name: 'id',
          description: 'The Class ID',
        },
      },
      responses: {
        ok: {
          description: 'List of assigned teachers',
          type: TeacherAssignmentResponseDto,
          isArray: true,
        },
        notFound: {
          description: 'Class not found',
        },
      },
    },
    createClass: {
      operation: {
        summary: 'Create a new class (Admin)',
        description:
          'Creates a new class with a unique name within the school. Rejects names with special characters, empty strings, or whitespace-only values. Returns the newly created class including ID, name, stream, and session_id.',
      },
      body: {
        name: {
          name: 'name',
          description:
            'The name of the class. Letters, numbers, and spaces only (e.g., "SSS 2").',
        },
        stream: {
          name: 'stream',
          description:
            'Optional stream for the class (e.g., "Science", "Arts", "Commerce").',
        },
        session_id: {
          name: 'session_id',
          description: 'The ID of the session this class belongs to.',
        },
      },
      responses: {
        created: {
          status: HttpStatus.CREATED,
          description: sysMsg.CLASS_CREATED,
          type: CreateClassDto,
        },
        badRequest: {
          status: HttpStatus.BAD_REQUEST,
          description:
            'Validation failed: name is empty, whitespace, or contains invalid characters.',
        },
        notFound: {
          status: HttpStatus.NOT_FOUND,
          description: sysMsg.SESSION_NOT_FOUND,
        },
        conflict: {
          status: HttpStatus.CONFLICT,
          description: sysMsg.CLASS_OR_CLASS_STREAM_ALREADY_EXIST,
        },
      },
    },
  },
};
