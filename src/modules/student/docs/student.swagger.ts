import * as sysMsg from '../../../constants/system.messages';
import { StudentResponseDto } from '../dto';

/**
 * Swagger documentation for Class endpoints.
 *
 * @module Class
 */

export const StudentSwagger = {
  tags: ['Student'],
  summary: 'Student Management',
  description:
    'Endpoints for creating, retrieving, updating, and deleting students.',
  endpoints: {
    create: {
      operation: {
        summary: 'Create a new student (ADMIN only)',
        description: 'Creates a Student with the provided data.',
      },
      parameters: {
        id: {
          name: 'id',
          description: 'The Class ID',
        },
      },
      responses: {
        created: {
          description: 'Student created successfully',
          type: StudentResponseDto,
        },
        badRequest: {
          description: sysMsg.BAD_REQUEST,
        },
        conflict: {
          description: `${sysMsg.STUDENT_EMAIL_CONFLICT} || ${sysMsg.STUDENT_REGISTRATION_NUMBER_CONFLICT}`,
        },
      },
    },
  },
};
