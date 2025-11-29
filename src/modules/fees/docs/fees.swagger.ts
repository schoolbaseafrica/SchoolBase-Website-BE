import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiTags,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

import {
  CreateFeeResponseDto,
  FeesListResponseDto,
} from '../dto/fees-response.dto';
import { CreateFeesDto } from '../dto/fees.dto';

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
        'Retrieve all fee components with optional filtering by status, class, term, or search term. By default, returns only ACTIVE fees. Use status query parameter to include INACTIVE fees.',
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
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing token',
    }),
  );
}
