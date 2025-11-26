import { HttpStatus } from '@nestjs/common';

import * as sysMsg from '../../../constants/system.messages';
import { ClassResponseDto, GroupedClassDto } from '../dto/create-class.dto';
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
          'Creates a new class with a unique name and arm (A, B, C, etc.) optional in the current session.',
      },
      body: {
        name: {
          name: 'name',
          description:
            'The name of the class. Letters, numbers, and spaces only (e.g., "SSS 2").',
        },
        arm: {
          name: 'arm',
          description:
            'The arm of the class (optional). If provided, must be one of: A, B, C, etc.',
          enum: ['A', 'B', 'C'],
          required: false,
        },
      },
      responses: {
        created: {
          status: HttpStatus.CREATED,
          description: sysMsg.CLASS_CREATED,
          type: ClassResponseDto,
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
          description: sysMsg.CLASS_ALREADY_EXIST,
        },
      },
    },
    getGroupedClasses: {
      operation: {
        summary: 'Get all classes grouped by name',
        description:
          'Returns all classes grouped by name, including their IDs, arms, and academic session. Returns an empty array if no classes exist.',
      },
      responses: {
        ok: {
          description: 'Grouped classes list',
          type: GroupedClassDto,
          isArray: true,
        },
        notFound: {
          description: 'No classes found',
        },
      },
    },
  },
};
