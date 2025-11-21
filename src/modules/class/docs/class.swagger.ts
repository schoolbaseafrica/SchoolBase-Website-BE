import { TeacherAssignmentResponseDto } from '../dto/teacher-response.dto';

/**
 * Swagger documentation for Class endpoints.
 *
 * @module Class
 */

export const ClassSwagger = {
  tags: ['Class'],
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
  },
};
