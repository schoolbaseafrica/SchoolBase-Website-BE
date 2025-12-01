import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

import { AdminDashboardResponseDto } from '../dto/admin-dashboard-response.dto';

export const ApiAdminDashboardTags = () =>
  applyDecorators(ApiTags('Admin Dashboard'));

export const ApiAdminDashboardBearerAuth = () =>
  applyDecorators(ApiBearerAuth());

export const ApiLoadTodayActivities = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Retrieve all scheduled academic activities for today',
      description:
        'Fetches all academic activities scheduled for the current date across the school. ' +
        'Aggregates timetable records with teacher, subject, class, and venue details. ' +
        'Returns data sorted chronologically by start time with progress status calculated based on current time. ' +
        'Includes summary statistics for monitoring daily operations and identifying unassigned teachers or scheduling conflicts. ' +
        'Requires ADMIN role authentication.',
    }),
    ApiResponse({
      status: 200,
      description: "Today's activities loaded successfully",
      type: AdminDashboardResponseDto,
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Invalid role or permissions',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 403 },
          message: { type: 'string', example: 'Forbidden' },
          error: { type: 'string', example: 'Forbidden' },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 401 },
          message: { type: 'string', example: 'Unauthorized' },
        },
      },
    }),
  );
