import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

import { CreateDepartmentDto } from '../dto/create-department.dto';
import { DepartmentResponseDto } from '../dto/department-response.dto';
import { UpdateDepartmentDto } from '../dto/update-department.dto';

/**
 * Swagger documentation for Department endpoints.
 *
 * @module Department
 */

/**
 * Swagger decorators for Department endpoints
 */
export const ApiDepartmentTags = () => applyDecorators(ApiTags('Department'));

export const ApiDepartmentBearerAuth = () => applyDecorators(ApiBearerAuth());

/**
 * Swagger decorators for Create Department endpoint
 */
export const ApiCreateDepartment = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create Department',
      description: 'Creates a new department. Department name must be unique.',
    }),
    ApiBody({
      type: CreateDepartmentDto,
      description: 'Create department payload',
      examples: {
        example1: {
          summary: 'Science Department',
          value: {
            name: 'Science',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Department created successfully.',
      type: DepartmentResponseDto,
    }),
    ApiResponse({
      status: 409,
      description: 'Department with this name already exists.',
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid input data.',
    }),
  );

/**
 * Swagger decorators for Update Department endpoint
 */
export const ApiUpdateDepartment = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update Department',
      description:
        'Updates an existing department. Department name must be unique.',
    }),
    ApiParam({
      name: 'id',
      description: 'Department ID',
      type: String,
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiBody({
      type: UpdateDepartmentDto,
      description: 'Update department payload',
      examples: {
        example1: {
          summary: 'Update Department Name',
          value: {
            name: 'Science & Technology',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Department updated successfully.',
      type: DepartmentResponseDto,
    }),
    ApiResponse({
      status: 404,
      description: 'Department not found.',
    }),
    ApiResponse({
      status: 409,
      description: 'Department with this name already exists.',
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid input data or operation failed.',
    }),
  );
