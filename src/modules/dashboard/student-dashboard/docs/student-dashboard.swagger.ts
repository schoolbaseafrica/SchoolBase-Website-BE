import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

import { StudentDashboardResponseDto } from '../dto/student-dashboard-response.dto';

export const ApiStudentDashboardTags = () =>
  applyDecorators(ApiTags('Student Dashboard'));

export const ApiStudentDashboardBearerAuth = () =>
  applyDecorators(ApiBearerAuth());

export const ApiLoadStudentDashboard = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Load student dashboard with consolidated data',
      description:
        "Fetches today's classes, latest results (5 most recent), and student announcements in a single consolidated payload. " +
        'Prioritizes performance by making parallel requests and provides fallback for missing modules. ' +
        'Validates enrollment, includes teacher details, handles cancelled classes, and sorts timetable by time. ' +
        'Requires STUDENT role authentication.',
    }),
    ApiResponse({
      status: 200,
      description: 'Student dashboard loaded successfully',
      type: StudentDashboardResponseDto,
    }),
    ApiResponse({
      status: 404,
      description: 'Student record not found',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 404 },
          message: { type: 'string', example: 'Student record not found' },
          error: { type: 'string', example: 'Not Found' },
        },
      },
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
