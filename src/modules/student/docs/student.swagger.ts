import * as sysMsg from '../../../constants/system.messages';
import { StudentResponseDto } from '../dto';

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
    list: {
      operation: {
        summary: 'Get all students with pagination (ADMIN only)',
        description:
          'Retrieve a paginated list of all students with search functionality.',
      },
      responses: {
        success: {
          description: 'Students retrieved successfully',
        },
      },
    },
    get: {
      operation: {
        summary: 'Get a student by ID',
        description:
          'ADMIN can access any student. Students can only access their own data.',
      },
      responses: {
        success: {
          description: 'Student retrieved successfully',
        },
        notFound: {
          description: sysMsg.STUDENT_NOT_FOUND,
        },
      },
    },
  },
};
