import { HttpStatus } from '@nestjs/common';

import * as sysMsg from '../../../constants/system.messages';
import { ClassResponseDto } from '../dto/create-class.dto';
import { StudentAssignmentResponseDto } from '../dto/student-assignment.dto';
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
        teacherIds: {
          name: 'teacherIds',
          description: 'Array of teacher IDs to assign to the class (optional)',
          type: 'array',
          items: { type: 'string' },
          required: false,
          example: ['teacher-uuid-1', 'teacher-uuid-2'],
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
          'Returns all classes grouped by name, including their IDs, arms, and academic session. Supports pagination via page and limit query parameters. Returns an empty array if no classes exist.',
      },
      parameters: {
        page: {
          name: 'page',
          in: 'query',
          required: false,
          description: 'Page number',
          schema: { type: 'integer', default: 1 },
        },
        limit: {
          name: 'limit',
          in: 'query',
          required: false,
          description: 'Number of records per page',
          schema: { type: 'integer', default: 20 },
        },
      },
      responses: {
        ok: {
          description: 'Grouped classes list with pagination',
          schema: {
            type: 'object',
            properties: {
              status_code: { type: 'integer', example: 200 },
              message: {
                type: 'string',
                example: 'class fetched successfully',
              },
              data: {
                type: 'object',
                properties: {
                  items: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/GroupedClassDto' },
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer', example: 4 },
                      limit: { type: 'integer', example: 20 },
                      page: { type: 'integer', example: 1 },
                      total_pages: { type: 'integer', example: 1 },
                      has_next: { type: 'boolean', example: false },
                      has_previous: { type: 'boolean', example: false },
                    },
                  },
                },
              },
            },
          },
        },
        notFound: {
          description: 'No classes found',
        },
      },
    },
    updateClass: {
      operation: {
        summary: 'Update class name or arm (Admin)',
        description:
          'Updates the name and/or arm of an existing class. Ensures the new name/arm combination is unique within the session.',
      },
      parameters: {
        id: {
          name: 'id',
          description: 'The Class ID to update',
        },
      },
      body: {
        name: {
          name: 'name',
          description: 'The new name of the class (optional).',
          required: false,
        },
        arm: {
          name: 'arm',
          description: 'The new arm of the class (optional).',
          required: false,
        },
      },
      responses: {
        ok: {
          status: HttpStatus.OK,
          description: 'Class updated successfully',
          type: ClassResponseDto,
        },
        badRequest: {
          status: HttpStatus.BAD_REQUEST,
          description: 'Validation failed: invalid name or arm.',
        },
        notFound: {
          status: HttpStatus.NOT_FOUND,
          description: 'Class not found',
        },
        conflict: {
          status: HttpStatus.CONFLICT,
          description:
            'Class with this name/arm already exists in the session.',
        },
      },
    },
    getClassById: {
      operation: {
        summary: 'Get class by ID',
        description: 'Returns details of a class by its unique ID.',
      },
      parameters: {
        id: {
          name: 'id',
          description: 'The Class ID',
        },
      },
      responses: {
        ok: {
          status: HttpStatus.OK,
          description: 'Class found',
          type: ClassResponseDto,
        },
        notFound: {
          status: HttpStatus.NOT_FOUND,
          description: 'Class not found',
        },
      },
    },
    getTotalClasses: {
      operation: {
        summary: 'Get total number of classes',
        description:
          'Returns the total count of classes in the system. Supports filtering by sessionId, name, and arm via query parameters.',
      },
      parameters: {
        sessionId: {
          name: 'sessionId',
          in: 'query',
          required: false,
          description: 'Academic session ID to filter by',
          schema: { type: 'string' },
        },
        name: {
          name: 'name',
          in: 'query',
          required: false,
          description: 'Class name to filter by',
          schema: { type: 'string' },
        },
        arm: {
          name: 'arm',
          in: 'query',
          required: false,
          description: 'Class arm to filter by',
          schema: { type: 'string' },
        },
      },
      responses: {
        ok: {
          status: HttpStatus.OK,
          description: 'Total number of classes',
          schema: {
            type: 'object',
            properties: {
              total: { type: 'integer', example: 42 },
            },
          },
        },
      },
    },
    deleteClass: {
      operation: {
        summary: 'Delete a class (Admin)',
        description:
          'Attention! Soft deletes a class by ID. Only classes from the active session can be deleted. Classes from past sessions cannot be deleted to preserve historical records.',
      },
      parameters: {
        id: {
          name: 'id',
          description: 'The Class ID to delete',
        },
      },
      responses: {
        ok: {
          status: HttpStatus.OK,
          description: sysMsg.CLASS_DELETED,
          schema: {
            type: 'object',
            properties: {
              status_code: { type: 'integer', example: 200 },
              message: { type: 'string', example: sysMsg.CLASS_DELETED },
            },
          },
        },
        badRequest: {
          status: HttpStatus.BAD_REQUEST,
          description: sysMsg.CANNOT_DELETE_PAST_SESSION_CLASS,
          schema: {
            type: 'object',
            properties: {
              status_code: { type: 'integer', example: 400 },
              message: {
                example: sysMsg.CANNOT_DELETE_PAST_SESSION_CLASS,
              },
              warning: {
                type: 'string',
                example:
                  'This class belongs to a past session and cannot be deleted to preserve historical records.',
              },
            },
          },
        },
        notFound: {
          status: HttpStatus.NOT_FOUND,
          description: sysMsg.CLASS_NOT_FOUND,
          schema: {
            type: 'object',
            properties: {
              status_code: { type: 'integer', example: 404 },
              message: { type: 'string', example: sysMsg.CLASS_NOT_FOUND },
            },
          },
        },
      },
    },
    assignStudents: {
      operation: {
        summary: 'Assign students to a class',
        description:
          'Assigns multiple students to a specific class. Students are automatically assigned to the class in the same academic session the class belongs to. Students already assigned will be skipped.',
      },
      parameters: {
        id: {
          name: 'id',
          description: 'The Class ID',
        },
      },
      responses: {
        ok: {
          status: HttpStatus.OK,
          description: 'Students assigned successfully',
          schema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                example: 'Successfully assigned 3 student(s) to class',
              },
              assigned: { type: 'number', example: 3 },
              classId: { type: 'string' },
            },
          },
        },
        notFound: {
          status: HttpStatus.NOT_FOUND,
          description: 'Class or student not found',
        },
        badRequest: {
          status: HttpStatus.BAD_REQUEST,
          description: 'Validation failed: invalid student IDs or empty array.',
        },
      },
    },
    getStudents: {
      operation: {
        summary: 'Get students assigned to a class',
        description:
          "Returns a list of students assigned to a specific class ID. Returns students from the class's academic session by default, but can be filtered by a different sessionId if provided.",
      },
      parameters: {
        id: {
          name: 'id',
          description: 'The Class ID',
        },
      },
      responses: {
        ok: {
          description: 'List of assigned students',
          type: StudentAssignmentResponseDto,
          isArray: true,
        },
        notFound: {
          description: 'Class not found',
        },
      },
    },
  },
};
