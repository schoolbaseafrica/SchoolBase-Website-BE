import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiQuery,
  ApiParam,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

import {
  ATTENDANCE_MARKED_SUCCESSFULLY,
  ATTENDANCE_RECORDS_RETRIEVED,
  ATTENDANCE_NOT_FOUND,
} from 'src/constants/system.messages';

import {
  BulkMarkAttendanceDto,
  UpdateAttendanceDto,
  AttendanceResponseDto,
} from '../dto';

/**
 * Swagger documentation for Attendance endpoints.
 *
 * @module Attendance
 */

/**
 * Swagger decorators for Attendance endpoints
 */
export const ApiAttendanceTags = () => applyDecorators(ApiTags('Attendance'));

export const ApiAttendanceBearerAuth = () => applyDecorators(ApiBearerAuth());

/**
 * Swagger decorators for Bulk Mark Attendance endpoint
 */
export const ApiBulkMarkAttendance = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Bulk mark attendance for a schedule/period (Teacher only)',
      description:
        'Teacher marks attendance for multiple students in a specific schedule (subject period) on a specific date. ' +
        'Validates that the teacher is assigned to the schedule and students are enrolled in the class. ' +
        'Updates existing records if attendance is already marked.',
    }),
    ApiBody({
      type: BulkMarkAttendanceDto,
      description: 'Bulk attendance marking payload',
      examples: {
        mathPeriod: {
          summary: 'Mathematics Period 3 - JSS1A',
          value: {
            schedule_id: '123e4567-e89b-12d3-a456-426614174000',
            date: '2025-12-02',
            attendance_records: [
              {
                student_id: '456e4567-e89b-12d3-a456-426614174001',
                status: 'present',
              },
              {
                student_id: '456e4567-e89b-12d3-a456-426614174002',
                status: 'late',
                notes: 'Arrived at 9:15 AM',
              },
              {
                student_id: '456e4567-e89b-12d3-a456-426614174003',
                status: 'absent',
                notes: 'Sick leave',
              },
            ],
          },
        },
      },
    }),
    ApiOkResponse({
      description: 'Attendance marked successfully',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: ATTENDANCE_MARKED_SUCCESSFULLY },
          status_code: { type: 'number', example: 200 },
          data: {
            type: 'object',
            properties: {
              marked: {
                type: 'number',
                example: 15,
                description: 'Number of new attendance records created',
              },
              updated: {
                type: 'number',
                example: 5,
                description: 'Number of existing records updated',
              },
              total: {
                type: 'number',
                example: 20,
                description: 'Total number of students processed',
              },
            },
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Cannot mark attendance for future dates',
    }),
    ApiForbiddenResponse({
      description:
        'Teacher not authorized to mark attendance for this schedule',
    }),
    ApiNotFoundResponse({
      description: 'Schedule not found or class not found for this schedule',
    }),
  );

/**
 * Swagger decorators for Get Schedule Attendance endpoint
 */
export const ApiGetScheduleAttendance = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get attendance for a specific schedule and date',
      description:
        'Retrieves all attendance records for a schedule (subject period) on a specific date. ' +
        'Returns details of which students were present, absent, late, or excused.',
    }),
    ApiParam({
      name: 'scheduleId',
      description: 'Schedule ID (timetable period)',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiQuery({
      name: 'date',
      required: true,
      type: String,
      description: 'Attendance date (YYYY-MM-DD)',
      example: '2025-12-02',
    }),
    ApiOkResponse({
      description: 'Attendance records retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Attendance records retrieved successfully',
          },
          status_code: { type: 'number', example: 200 },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                schedule_id: { type: 'string' },
                student_id: { type: 'string' },
                session_id: { type: 'string' },
                date: { type: 'string', format: 'date' },
                status: {
                  type: 'string',
                  enum: ['present', 'absent', 'late', 'excused'],
                },
                marked_by: { type: 'string' },
                marked_at: { type: 'string', format: 'date-time' },
                notes: { type: 'string', nullable: true },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Schedule not found',
    }),
  );

/**
 * Swagger decorators for Update Attendance Record endpoint
 */
export const ApiUpdateAttendance = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update a single attendance record (Teacher only)',
      description:
        'Updates the status or notes of an existing attendance record. ' +
        'Useful for correcting mistakes or updating attendance after initial marking.',
    }),
    ApiParam({
      name: 'id',
      description: 'Attendance record ID',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiBody({
      type: UpdateAttendanceDto,
      description: 'Update attendance payload',
      examples: {
        updateStatus: {
          summary: 'Change status to present',
          value: {
            status: 'present',
          },
        },
        updateWithNotes: {
          summary: 'Mark late with reason',
          value: {
            status: 'late',
            notes: 'Medical appointment',
          },
        },
      },
    }),
    ApiOkResponse({
      description: 'Attendance updated successfully',
      type: AttendanceResponseDto,
    }),
    ApiNotFoundResponse({
      description: ATTENDANCE_NOT_FOUND,
    }),
  );

/**
 * Swagger decorators for Get Student's Own Attendance endpoint
 */
export const ApiGetStudentAttendance = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get own attendance history (Student only)',
      description:
        'Student retrieves their own attendance records with optional filters for date range and status. ' +
        'Supports pagination.',
    }),
    ApiQuery({
      name: 'start_date',
      required: false,
      type: String,
      description: 'Start date for range filter (YYYY-MM-DD)',
      example: '2025-09-01',
    }),
    ApiQuery({
      name: 'end_date',
      required: false,
      type: String,
      description: 'End date for range filter (YYYY-MM-DD)',
      example: '2025-12-31',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: ['present', 'absent', 'late', 'excused'],
      description: 'Filter by attendance status',
    }),
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
    ApiOkResponse({
      description: 'Attendance records retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: ATTENDANCE_RECORDS_RETRIEVED,
          },
          status_code: { type: 'number', example: 200 },
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/AttendanceResponseDto' },
          },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              page: { type: 'number' },
              limit: { type: 'number' },
              total_pages: { type: 'number' },
            },
          },
        },
      },
    }),
  );

/**
 * Swagger decorators for Get All Attendance Records endpoint
 */
export const ApiGetAttendanceRecords = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get attendance records with filters (Admin/Teacher)',
      description:
        'Retrieves attendance records with optional filters for schedule, student, date range, and status. ' +
        'Supports pagination. Admin and teachers can view all records.',
    }),
    ApiQuery({
      name: 'schedule_id',
      required: false,
      type: String,
      description: 'Filter by schedule ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiQuery({
      name: 'student_id',
      required: false,
      type: String,
      description: 'Filter by student ID',
      example: '456e4567-e89b-12d3-a456-426614174001',
    }),
    ApiQuery({
      name: 'start_date',
      required: false,
      type: String,
      description: 'Start date for range filter (YYYY-MM-DD)',
      example: '2025-09-01',
    }),
    ApiQuery({
      name: 'end_date',
      required: false,
      type: String,
      description: 'End date for range filter (YYYY-MM-DD)',
      example: '2025-12-31',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: ['present', 'absent', 'late', 'excused'],
      description: 'Filter by attendance status',
    }),
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
    ApiOkResponse({
      description: 'Student attendance retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: ATTENDANCE_RECORDS_RETRIEVED,
          },
          status_code: { type: 'number', example: 200 },
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/AttendanceResponseDto' },
          },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              page: { type: 'number' },
              limit: { type: 'number' },
              total_pages: { type: 'number' },
            },
          },
        },
      },
    }),
  );

/**
 * Swagger decorators for Check Attendance Marked endpoint
 */
export const ApiCheckAttendanceMarked = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Check if attendance is already marked for a schedule/date',
      description:
        'Returns whether attendance has been marked for a specific schedule period and the count of attendance records. ' +
        'Useful for preventing duplicate marking and showing status to teachers.',
    }),
    ApiParam({
      name: 'scheduleId',
      description: 'Schedule ID (timetable period)',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiParam({
      name: 'date',
      description: 'Date (YYYY-MM-DD)',
      type: 'string',
      example: '2025-12-02',
    }),
    ApiOkResponse({
      description: 'Check result returned',
      schema: {
        type: 'object',
        properties: {
          is_marked: {
            type: 'boolean',
            example: true,
            description: 'Whether attendance has been marked',
          },
          count: {
            type: 'number',
            example: 20,
            description: 'Number of attendance records found',
          },
        },
      },
    }),
  );
