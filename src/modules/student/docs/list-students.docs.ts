import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';

import { StudentGrowthReportResponseDto } from '../dto/student.growth.dto';

export const ListStudentsDocs = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all students with pagination (ADMIN only)',
      description:
        'Retrieve a paginated list of all students. Supports search by name, email, or registration number.',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (default: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Number of records per page (default: 10)',
      example: 10,
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description:
        'Search term (searches in first name, last name, email, registration number)',
      example: 'John',
    }),
    ApiResponse({
      status: 200,
      description: 'Students retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Students fetched successfully',
          },
          status_code: {
            type: 'number',
            example: 200,
          },
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/StudentResponseDto' },
          },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'number', example: 1 },
              page: { type: 'number', example: 1 },
              limit: { type: 'number', example: 10 },
              totalPages: { type: 'number', example: 1 },
            },
          },
        },
      },
    }),
    ApiBearerAuth(),
  );
};

export const studentGrowthDecorator = () => {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get all students growth metrics (ADMIN only)',
    }),
    ApiOkResponse({
      description:
        'Returns the student growth report for a given academic year',
      type: StudentGrowthReportResponseDto,
    }),
  );
};
