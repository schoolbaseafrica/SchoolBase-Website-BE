import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiTags,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';

import { DeactivateFeeDto } from '../dto/deactivate-fee.dto';
import { FeeStudentResponseDto } from '../dto/fee-students-response.dto';
import {
  CreateFeeResponseDto,
  FeesListResponseDto,
  FeesResponseDto,
  DeactivateFeeResponseDto,
  ActivateFeeResponseDto,
} from '../dto/fees-response.dto';
import { CreateFeesDto, UpdateFeesDto } from '../dto/fees.dto';

export function swaggerCreateFee() {
  return applyDecorators(
    ApiTags('Fees'),
    ApiOperation({
      summary: 'Create a new fee component',
      description:
        'Create a new fee component. Only admins can perform this action.',
    }),
    ApiBearerAuth(),
    ApiBody({ type: CreateFeesDto }),
    ApiResponse({
      status: 201,
      description: 'Fee component created successfully',
      type: CreateFeeResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Invalid input data',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing token',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - User is not an admin',
    }),
  );
}

export function swaggerGetAllFees() {
  return applyDecorators(
    ApiTags('Fees'),
    ApiOperation({
      summary: 'Get all fee components',
      description:
        'Retrieve all fee components with optional filtering by status, class, term, or search term. Returns all fees regardless of status by default. Use status query parameter to include INACTIVE fees.',
    }),
    ApiBearerAuth(),
    ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE'] }),
    ApiQuery({ name: 'class_id', required: false, type: String }),
    ApiQuery({ name: 'term_id', required: false, type: String }),
    ApiQuery({ name: 'search', required: false, type: String }),
    ApiQuery({ name: 'page', required: false, type: Number }),
    ApiQuery({ name: 'limit', required: false, type: Number }),
    ApiResponse({
      status: 200,
      description: 'Fee components retrieved successfully',
      type: FeesListResponseDto,
    }),
  );
}

export function swaggerUpdateFee() {
  return applyDecorators(
    ApiTags('Fees'),
    ApiOperation({
      summary: 'Update an existing fee component',
      description:
        'Update an existing fee component. Only admins can perform this action.',
    }),
    ApiBearerAuth(),
    ApiBody({ type: UpdateFeesDto }),
    ApiResponse({
      status: 200,
      description: 'Fee component updated successfully',
      type: CreateFeeResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Invalid input data',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing token',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - User is not an admin',
    }),
    ApiResponse({
      status: 404,
      description: 'Fee component not found',
    }),
  );
}

export function swaggerGetAFee() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get a single fee component',
      description:
        'Retrieve a specific fee component by its ID. Returns details such as name, amount, type, and metadata about the fee component.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'id',
      required: true,
      type: String,
      description: 'The ID of the fee component to retrieve',
    }),
    ApiResponse({
      status: 200,
      description: 'Fee component retrieved successfully',
      type: FeesResponseDto,
    }),
    ApiResponse({
      status: 404,
      description: 'Fee component not found',
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid feeComponentId supplied',
    }),
  );
}

// docs/fees.swagger.ts - Add this function
export function swaggerDeactivateFee() {
  return applyDecorators(
    ApiTags('Fees'),
    ApiOperation({
      summary: 'Deactivate a fee component',
      description:
        'Deactivate (soft-delete) a fee component so it is no longer used in billing operations. Only admins can perform this action.',
    }),
    ApiBearerAuth(),
    ApiBody({ type: DeactivateFeeDto }),
    ApiParam({
      name: 'id',
      description: 'The ID of the fee component to deactivate',
      example: 'f1e2d3c4-b5a6-7890-1234-567890abcdef',
    }),
    ApiResponse({
      status: 200,
      description: 'Fee component deactivated successfully',
      type: DeactivateFeeResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Fee component is already inactive',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing token',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - User is not an admin',
    }),
    ApiResponse({
      status: 404,
      description: 'Not found - Fee component not found',
    }),
  );
}

export function swaggerActivateFee() {
  return applyDecorators(
    ApiTags('Fees'),
    ApiOperation({
      summary: 'Activate a fee component',
      description:
        'Activate a previously deactivated fee component to make it available for billing operations. Only admins can perform this action.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'id',
      description: 'The ID of the fee component to activate',
      example: 'f1e2d3c4-b5a6-7890-1234-567890abcdef',
    }),
    ApiResponse({
      status: 200,
      description: 'Fee component activated successfully',
      type: ActivateFeeResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Fee component is already active',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing token',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - User is not an admin',
    }),
    ApiResponse({
      status: 404,
      description: 'Not found - Fee component not found',
    }),
  );
}

export function swaggerGetFeeStudents() {
  return applyDecorators(
    ApiTags('Fees'),
    ApiOperation({
      summary: 'Get students assigned to a fee',
      description:
        'Retrieve a list of students assigned to a specific fee component, either through class assignment or direct assignment.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'id',
      description: 'The ID of the fee component',
      example: 'f1e2d3c4-b5a6-7890-1234-567890abcdef',
    }),
    ApiResponse({
      status: 200,
      description: 'Students retrieved successfully',
      type: FeeStudentResponseDto,
      isArray: true,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing token',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - User is not an admin',
    }),
    ApiResponse({
      status: 404,
      description: 'Not found - Fee component not found',
    }),
  );
}
