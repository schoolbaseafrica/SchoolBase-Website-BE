import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';

import { CreateParentDto, ParentResponseDto, UpdateParentDto } from '../dto';

/**
 * Swagger decorators for Parent endpoints
 */
export const ApiParentTags = () => applyDecorators(ApiTags('Parents'));

export const ApiParentBearerAuth = () => applyDecorators(ApiBearerAuth());

/**
 * Swagger decorators for Create Parent endpoint
 */
export const ApiCreateParent = () =>
  applyDecorators(
    ApiOperation({ summary: 'Create a new parent (ADMIN only)' }),
    ApiBody({ type: CreateParentDto }),
    ApiResponse({
      status: 201,
      description: 'Parent created successfully',
      type: ParentResponseDto,
    }),
    ApiResponse({
      status: 409,
      description: 'Email already exists',
    }),
  );

/**
 * Swagger decorators for Get Parent by ID endpoint
 */
export const ApiGetParent = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get a parent by ID (ADMIN only)' }),
    ApiParam({
      name: 'id',
      description: 'Parent ID (UUID)',
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Parent retrieved successfully',
      type: ParentResponseDto,
    }),
    ApiResponse({
      status: 404,
      description: 'Parent not found',
    }),
  );

/**
 * Swagger decorators for List Parents endpoint
 */
export const ApiListParents = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get all parents with pagination (ADMIN only)',
      description:
        'Retrieve a paginated list of all parents. Supports search by name or email.',
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
      description: 'Search term (searches in first name, last name, email)',
      example: 'John',
    }),
    ApiResponse({
      status: 200,
      description: 'Parents retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Parents fetched successfully',
          },
          status_code: {
            type: 'number',
            example: 200,
          },
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/ParentResponseDto' },
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
  );

/**
 * Swagger decorators for Update Parent endpoint
 */
export const ApiUpdateParent = () =>
  applyDecorators(
    ApiOperation({ summary: 'Update parent (partial, ADMIN only)' }),
    ApiParam({
      name: 'id',
      description: 'Parent ID (UUID)',
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiBody({ type: UpdateParentDto }),
    ApiResponse({
      status: 200,
      description: 'Parent updated successfully',
      type: ParentResponseDto,
    }),
    ApiResponse({ status: 404, description: 'Parent not found' }),
    ApiResponse({
      status: 409,
      description: 'Email cannot be updated after creation',
    }),
  );
