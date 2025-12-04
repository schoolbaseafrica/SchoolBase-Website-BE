import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';

import { PaginatedClassResultsResponseDto } from '../dto';

/**
 * Swagger decorators for Get Class Results endpoint
 */
export const DocsGetClassResults = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get results for all students in a class',
      description:
        'Retrieve comprehensive results for all students in a specific class, filtered by term and academic session',
    }),
    ApiParam({
      name: 'classId',
      description: 'UUID of the class to retrieve results for',
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiQuery({
      name: 'term_id',
      description: 'UUID of the term for which results are requested',
      required: true,
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    ApiQuery({
      name: 'academic_session_id',
      description:
        'UUID of the academic session (optional, defaults to active session if not provided)',
      required: false,
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174002',
    }),
    ApiQuery({
      name: 'page',
      description: 'Page number for pagination',
      required: false,
      type: Number,
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      description: 'Number of results per page',
      required: false,
      type: Number,
      example: 20,
    }),
    ApiResponse({
      status: 200,
      description: 'Class results retrieved successfully',
      type: PaginatedClassResultsResponseDto,
    }),
    ApiResponse({ status: 404, description: 'Class or term not found' }),
  );
