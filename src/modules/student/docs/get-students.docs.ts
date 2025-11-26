import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

export const GetStudentDocs = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Get a student by ID',
      description:
        'ADMIN can access any student. Students can only access their own data.',
    }),
    ApiParam({
      name: 'id',
      description: 'Student ID (UUID)',
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Student retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Student fetched successfully',
          },
          status_code: {
            type: 'number',
            example: 200,
          },
          data: { $ref: '#/components/schemas/StudentResponseDto' },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Student not found',
    }),
    ApiBearerAuth(),
  );
};
