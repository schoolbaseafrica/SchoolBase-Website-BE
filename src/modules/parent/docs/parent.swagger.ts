import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';

import { CreateParentDto, ParentResponseDto } from '../dto';

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
