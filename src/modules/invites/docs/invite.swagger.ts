import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import * as sysMsg from '../../../constants/system.messages';
import { CreatedInvitesResponseDto } from '../dto/invite-user.dto';

/**
 * Swagger decorators for Invite endpoints
 */
export const ApiInviteTags = () => applyDecorators(ApiTags('Invite'));

/**
 * Swagger decorators for Invite User endpoint
 */
export const ApiInviteUser = () =>
  applyDecorators(
    ApiOperation({ summary: 'Send user invitation' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: sysMsg.INVITE_SENT,
      type: CreatedInvitesResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: sysMsg.VALIDATION_ERROR,
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'User already exists or active invitation pending',
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: sysMsg.OPERATION_FAILED,
    }),
  );

/**
 * Swagger decorators for Accept Invite endpoint
 */
export const ApiAcceptInvite = () =>
  applyDecorators(
    ApiOperation({ summary: 'Accept invitation and set password' }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: sysMsg.ACCOUNT_CREATED,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: sysMsg.INVALID_VERIFICATION_TOKEN,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: sysMsg.TOKEN_EXPIRED,
    }),
  );
