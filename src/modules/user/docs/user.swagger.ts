import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

import { ApiSuccessResponseDto } from '../../../common/dto/response.dto';
import * as sysMsg from '../../../constants/system.messages';
import { User } from '../entities/user.entity';

export const ApiUserTags = () =>
  applyDecorators(ApiOperation({ summary: 'User Endpoints' }));

/**
 * Create User
 */
export const ApiCreateUser = () =>
  applyDecorators(
    ApiOperation({ summary: 'Create a new user' }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: sysMsg.USER_CREATED_SUCCESSFULLY,
      type: User,
    }),
    ApiBadRequestResponse({
      description: sysMsg.VALIDATION_ERROR,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: sysMsg.OPERATION_FAILED,
    }),
  );

/**
 * Update Current User
 */
export const ApiUpdateUser = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Update current user' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: sysMsg.USER_UPDATED_SUCCESSFULLY,
      type: User,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: sysMsg.UNAUTHORIZED,
    }),
    ApiBadRequestResponse({
      description: sysMsg.VALIDATION_ERROR,
    }),
  );

/**
 * Delete User
 */
export const ApiDeleteUser = () =>
  applyDecorators(
    ApiOperation({ summary: 'Delete a user' }),
    ApiBadRequestResponse({
      description: 'Validation failed (uuid expected)',
    }),
    ApiNotFoundResponse({
      description: 'User not found',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Account deleted successfully',
      type: ApiSuccessResponseDto,
    }),
  );
