import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  ReviewTeacherManualCheckinResponseDto,
  TeacherCheckinRequestResponseDto,
} from '../dto';
import { TeacherManualCheckinStatusEnum } from '../enums/teacher-manual-checkin.enum';

// --- REVIEW TEACHER CHECKIN REQUEST ---
export const ApiReviewTeacherManualCheckinDocs = () =>
  applyDecorators(
    ApiTags('Attendance'),
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Review teacher manual checkin request (Admin only)',
      description: 'Approve or reject a teacher manual checkin request',
    }),
    ApiParam({
      name: 'id',
      description: 'Checkin request ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Request reviewed successfully',
      type: ReviewTeacherManualCheckinResponseDto,
    }),
    ApiBadRequestResponse({
      description: 'Request already processed or validation error',
    }),
    ApiNotFoundResponse({
      description: 'Checkin request or teacher not found',
    }),
    ApiConflictResponse({
      description: 'Attendance already marked for this date',
    }),
    ApiInternalServerErrorResponse({
      description: 'Internal server error',
    }),
  );

// --- LIST TEACHER CHECKIN REQUESTS ---
export const ApiListTeacherCheckinRequestsDocs = () =>
  applyDecorators(
    ApiTags('Attendance'),
    ApiBearerAuth(),
    ApiOperation({
      summary: 'List teacher checkin requests (Admin only)',
      description:
        'Get all teacher manual checkin requests with optional filters',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: TeacherManualCheckinStatusEnum,
      description: 'Filter by status',
    }),
    ApiQuery({
      name: 'check_in_date',
      required: false,
      type: 'string',
      description: 'Filter by date (YYYY-MM-DD)',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: 'number',
      description: 'Page number',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: 'number',
      description: 'Items per page',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Requests fetched successfully',
      type: [TeacherCheckinRequestResponseDto],
    }),
    ApiInternalServerErrorResponse({
      description: 'Internal server error',
    }),
  );
