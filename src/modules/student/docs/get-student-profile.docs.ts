import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { StudentProfileResponseDto } from '../dto';

export const GetStudentProfileDocs = () => {
  return applyDecorators(
    ApiOperation({
      summary: "Get a student's profile by ID",
      description:
        'Retrieves a student profile. ADMIN can access any student profile, while a STUDENT can only access their own.',
    }),
    ApiParam({
      name: 'studentId',
      description: "The student's ID (UUID)",
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Student retrieved successfully',
      type: StudentProfileResponseDto,
    }),
    ApiResponse({
      status: 404,
      description: 'Student not found',
    }),
    ApiBearerAuth(),
  );
};
