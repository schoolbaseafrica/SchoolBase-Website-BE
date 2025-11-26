import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

import { DashboardResolvedResponseDto } from '../dto/dashboard-resolver-response.dto';

export const ApiDashboardTags = () => applyDecorators(ApiTags('Dashboard'));

export const ApiDashboardBearerAuth = () => applyDecorators(ApiBearerAuth());

export const ApiResolveDashboard = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Resolve dashboard for authenticated user',
      description:
        "Returns the appropriate dashboard type and startup data based on the authenticated user's role. " +
        'Validates JWT token role against database role and returns role-specific modules and metadata.',
    }),
    ApiResponse({
      status: 200,
      description: 'Dashboard resolved successfully',
      type: DashboardResolvedResponseDto,
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Role mismatch, missing role, or invalid token',
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
