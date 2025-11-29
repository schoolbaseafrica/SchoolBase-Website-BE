import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';

import { CreateFeeResponseDto } from '../dto/fees-response.dto';
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
