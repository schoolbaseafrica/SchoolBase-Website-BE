import * as sysMsg from '../../../constants/system.messages';
import { StudentResponseDto } from '../dto';

/**
 * Swagger documentation for Student endpoints.
 *
 * @module Student
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
      responses: {
        created: {
          description: sysMsg.STUDENT_CREATED,
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
    update: {
      operation: {
        summary: 'Update Student Information (ADMIN only)',
        description: 'Updates information of an already existing student.',
      },
      parameters: {
        id: {
          name: 'id',
          description: 'The Student ID',
        },
      },
      responses: {
        ok: {
          description: sysMsg.STUDENT_UPDATED,
          type: StudentResponseDto,
        },
        badRequest: {
          description: sysMsg.BAD_REQUEST,
        },
        conflict: {
          description: sysMsg.STUDENT_EMAIL_CONFLICT,
        },
        notFound: {
          description: sysMsg.STUDENT_NOT_FOUND,
        },
      },
    },
  },
};
