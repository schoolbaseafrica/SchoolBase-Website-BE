import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

import * as sysMsg from '../../../constants/system.messages';
import { CreatedInvitesResponseDto } from '../dto/invite-user.dto';
import { InviteStatus } from '../entities/invites.entity';

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

/**
 * Swagger decorators for Get all invites
 */
export const ApiListInvites = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get all invites with filtering & pagination (ADMIN only)',
      description:
        'Retrieve a paginated list of invites. Supports filtering by status, role, date ranges, and email.',
    }),

    // Pagination
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
      description: 'Number of records per page (default: 20)',
      example: 20,
    }),

    // Filters
    ApiQuery({
      name: 'status',
      required: false,
      enum: InviteStatus,
      description: 'Filter by invite status',
      example: InviteStatus.PENDING,
    }),
    ApiQuery({
      name: 'role',
      required: false,
      type: String,
      description: 'Filter by invited role (e.g., admin, teacher)',
      example: 'teacher',
    }),
    ApiQuery({
      name: 'email',
      required: false,
      type: String,
      description: 'Search invites by email',
      example: 'john@example.com',
    }),

    // Date filters
    ApiQuery({
      name: 'invited_from',
      required: false,
      type: String,
      description: 'Filter invites created after this date (ISO format)',
      example: '2025-01-01T00:00:00.000Z',
    }),
    ApiQuery({
      name: 'invited_to',
      required: false,
      type: String,
      description: 'Filter invites created before this date (ISO format)',
      example: '2025-01-31T23:59:59.999Z',
    }),
    ApiQuery({
      name: 'expires_after',
      required: false,
      type: String,
      description: 'Filter invites expiring after this date',
      example: '2025-02-01T00:00:00.000Z',
    }),
    ApiQuery({
      name: 'expires_before',
      required: false,
      type: String,
      description: 'Filter invites expiring before this date',
      example: '2025-03-01T00:00:00.000Z',
    }),

    // Sorting
    ApiQuery({
      name: 'sort_by',
      required: false,
      type: String,
      description: 'Sort field',
      example: 'invited_at',
      enum: ['invited_at', 'expires_at', 'email', 'status'],
    }),
    ApiQuery({
      name: 'order',
      required: false,
      type: String,
      description: 'Sort order',
      example: 'desc',
      enum: ['asc', 'desc'],
    }),

    // Response
    ApiResponse({
      status: 200,
      description: 'Invites retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Invites fetched successfully',
          },
          status_code: {
            type: 'number',
            example: 200,
          },
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/InviteResponseDto' },
          },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'number', example: 100 },
              page: { type: 'number', example: 1 },
              limit: { type: 'number', example: 20 },
              totalPages: { type: 'number', example: 5 },
            },
          },
        },
      },
    }),
  );
