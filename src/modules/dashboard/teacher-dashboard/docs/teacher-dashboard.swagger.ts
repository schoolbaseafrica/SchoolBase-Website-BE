import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { TodaysClassesResponseDto } from '../dto/teacher-dashboard-response.dto';

export function apiGetTodaysClasses() {
  return applyDecorators(
    ApiOperation({
      summary: "Get today's classes for teacher",
      description:
        'Fetches all classes scheduled for the authenticated teacher on the current date. ' +
        'Returns classes sorted by start time with full metadata including class name, subject, time, and room.',
    }),
    ApiResponse({
      status: 200,
      description: "Today's classes retrieved successfully",
      type: TodaysClassesResponseDto,
    }),
    ApiBadRequestResponse({
      description: 'Invalid request parameters',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated or not a teacher',
    }),
  );
}
