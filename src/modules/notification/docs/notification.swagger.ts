import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { PaginatedNotificationsResponseDto } from '../dto/user-notification-response.dto';

export const ApiNotificationTags = () =>
  applyDecorators(ApiTags('Notifications'));
export const ApiNotificationBearerAuth = () => applyDecorators(ApiBearerAuth());

export const ApiGetUserNotifications = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get user notifications',
      description:
        'Retrieves paginated list of notifications for the authenticated user. ' +
        'User ID is automatically extracted from the JWT token. ' +
        'Supports filtering by read status and pagination.',
    }),
    ApiQuery({
      name: 'page',
      description: 'Page number for pagination',
      required: false,
      type: Number,
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      description: 'Number of notifications per page',
      required: false,
      type: Number,
      example: 20,
    }),
    ApiQuery({
      name: 'is_read',
      description: 'Filter by read status (true = read, false = unread)',
      required: false,
      type: Boolean,
      example: false,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Notifications retrieved successfully',
      type: PaginatedNotificationsResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - Invalid or missing JWT token',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 401 },
          message: { type: 'string', example: 'Unauthorized' },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Bad Request - Invalid query parameters',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 400 },
          message: {
            type: 'array',
            items: { type: 'string' },
            example: ['page must be a positive number'],
          },
        },
      },
    }),
  );
