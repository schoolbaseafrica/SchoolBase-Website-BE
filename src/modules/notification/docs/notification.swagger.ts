import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

import { UserNotificationByIdResponseDto } from '../dto/user-notification-by-id-response.dto';
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

export const ApiGetNotificationById = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get notification by ID',
      description:
        'Retrieves a single notification by its ID for the authenticated user. ' +
        'User ID is automatically extracted from the JWT token. ' +
        'Users can only access their own notifications (authorization enforced).',
    }),
    ApiParam({
      name: 'id',
      description: 'Unique identifier of the notification',
      type: String,
      example: 'd4872d98-380c-4745-a4d9-d4c3161b92e0',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Notification retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Notification retrieved successfully',
          },
          data: {
            $ref: '#/components/schemas/UserNotificationByIdResponseDto',
          },
        },
      },
      type: UserNotificationByIdResponseDto,
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
      status: HttpStatus.NOT_FOUND,
      description: 'Notification not found',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 404 },
          message: { type: 'string', example: 'Notification not found' },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description:
        "Forbidden - User attempting to access another user's notification",
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 403 },
          message: {
            type: 'string',
            example: 'You are not authorized to view these notifications',
          },
        },
      },
    }),
  );
