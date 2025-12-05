import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

import { PaginatedResultsResponseDto } from '../dto/paginated-results.dto';

/**
 * Swagger decorators for Get All Results endpoint
 */
export const DocsGetAllResults = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get all student results (Admin)',
      description:
        'Retrieve paginated results for all students across sessions, terms, and classes. Supports optional filters such as academic session, term, class, and student.',
    }),

    ApiQuery({
      name: 'academic_session_id',
      description:
        'UUID of the academic session to filter results by (optional)',
      required: false,
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174002',
    }),

    ApiQuery({
      name: 'term_id',
      description: 'UUID of the term to filter results by (optional)',
      required: false,
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),

    ApiQuery({
      name: 'class_id',
      description: 'UUID of the class to filter results by (optional)',
      required: false,
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174003',
    }),

    ApiQuery({
      name: 'student_id',
      description: 'UUID of a specific student to filter results by (optional)',
      required: false,
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174004',
    }),

    ApiQuery({
      name: 'include_subject_lines',
      description:
        'Whether to include subject-level breakdown for each result (optional, default: false)',
      required: false,
      type: Boolean,
      example: false,
    }),

    ApiQuery({
      name: 'page',
      description: 'Page number for pagination (optional)',
      required: false,
      type: Number,
      example: 1,
    }),

    ApiQuery({
      name: 'limit',
      description: 'Number of items per page (optional)',
      required: false,
      type: Number,
      example: 20,
    }),

    ApiResponse({
      status: 200,
      description: 'Results retrieved successfully',
      type: PaginatedResultsResponseDto,
    }),

    ApiResponse({
      status: 404,
      description: 'No results found for the provided filters',
    }),
  );
