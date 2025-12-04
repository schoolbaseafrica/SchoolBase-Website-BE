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
  ATTENDANCE_UPDATED_SUCCESSFULLY,
} from 'src/constants/system.messages';

import {
  MarkAttendanceDto,
  UpdateAttendanceDto,
  UpdateStudentDailyAttendanceDto,
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
 * Swagger decorators for Bulk Mark Attendance endpoint (Schedule-Based)
 */
export const ApiBulkMarkAttendance = () =>
  applyDecorators(
    ApiOperation({
      summary:
        'Mark schedule-based attendance for a schedule/period (Teacher only)',
      description:
        'Teacher marks attendance for multiple students in a specific schedule (subject period) on a specific date. ' +
        'Validates that the teacher is assigned to the schedule and students are enrolled in the class. ' +
        'Updates existing records if attendance is already marked. Uses unified MarkAttendanceDto.',
    }),
    ApiBody({
      type: MarkAttendanceDto,
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
                status: 'PRESENT',
              },
              {
                student_id: '456e4567-e89b-12d3-a456-426614174002',
                status: 'LATE',
                notes: 'Arrived at 9:15 AM',
              },
              {
                student_id: '456e4567-e89b-12d3-a456-426614174003',
                status: 'ABSENT',
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
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: ATTENDANCE_UPDATED_SUCCESSFULLY,
          },
          status_code: { type: 'number', example: 200 },
          data: { $ref: '#/components/schemas/AttendanceResponseDto' },
        },
      },
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

/**
 * Swagger decorators for Student Daily Attendance endpoints
 */

/**
 * Mark Student Daily Attendance endpoint
 */
export const ApiMarkStudentDailyAttendance = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Mark daily attendance for a class (Teacher/Admin only)',
      description:
        'Bulk mark once-per-day attendance for students in a class. ' +
        'System automatically records check-in time when marking attendance. ' +
        'Teacher only needs to specify student_id and status for each student. ' +
        'Optional notes can be added for context (e.g., "Traffic delay", "Sick leave").',
    }),
    ApiBody({
      type: MarkAttendanceDto,
      description: 'Student daily attendance marking payload',
      examples: {
        morningRegister: {
          summary: 'Morning Register - Bulk attendance for entire class',
          value: {
            class_id: '123e4567-e89b-12d3-a456-426614174000',
            date: '2025-12-02',
            attendance_records: [
              {
                student_id: '456e4567-e89b-12d3-a456-426614174001',
                status: 'PRESENT',
              },
              {
                student_id: '456e4567-e89b-12d3-a456-426614174002',
                status: 'LATE',
                notes: 'Traffic delay',
              },
              {
                student_id: '456e4567-e89b-12d3-a456-426614174003',
                status: 'ABSENT',
                notes: 'Sick leave',
              },
              {
                student_id: '456e4567-e89b-12d3-a456-426614174004',
                status: 'PRESENT',
              },
              {
                student_id: '456e4567-e89b-12d3-a456-426614174005',
                status: 'EXCUSED',
                notes: 'Medical appointment',
              },
            ],
          },
        },
      },
    }),
    ApiOkResponse({
      description: 'Student daily attendance marked successfully',
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
      description: 'Teacher not authorized to mark attendance for this class',
    }),
    ApiNotFoundResponse({
      description: 'Class not found',
    }),
  );

/**
 * Get Class Daily Attendance endpoint
 */
export const ApiGetClassDailyAttendance = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get total daily attendance for a class on a specific date',
      description:
        'Retrieves all daily attendance records for a class on a specific date. ' +
        'Returns details of student check-in/check-out times and daily status. ' +
        'If no date is provided, defaults to today.',
    }),
    ApiParam({
      name: 'classId',
      description: 'Class ID',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiQuery({
      name: 'date',
      required: false,
      type: String,
      description:
        'Attendance date (YYYY-MM-DD). Defaults to today if not provided.',
      example: '2025-12-02',
    }),
    ApiOkResponse({
      description: 'Daily attendance records retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Class daily attendance retrieved successfully',
          },
          status_code: { type: 'number', example: 200 },
          data: {
            type: 'object',
            properties: {
              class_id: { type: 'string' },
              date: { type: 'string', format: 'date', example: '2025-12-02' },
              students: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    student_id: { type: 'string' },
                    first_name: { type: 'string' },
                    middle_name: { type: 'string', nullable: true },
                    last_name: { type: 'string' },
                    attendance_id: {
                      type: 'string',
                      nullable: true,
                      description:
                        'Attendance record ID - use this for PATCH updates',
                    },
                    status: {
                      type: 'string',
                      enum: [
                        'PRESENT',
                        'ABSENT',
                        'LATE',
                        'EXCUSED',
                        'HALF_DAY',
                      ],
                      nullable: true,
                    },
                    check_in_time: { type: 'string', nullable: true },
                    check_out_time: { type: 'string', nullable: true },
                    notes: { type: 'string', nullable: true },
                  },
                },
              },
              summary: {
                type: 'object',
                properties: {
                  total_students: { type: 'number' },
                  present_count: { type: 'number' },
                  absent_count: { type: 'number' },
                  late_count: { type: 'number' },
                  excused_count: { type: 'number' },
                  half_day_count: { type: 'number' },
                  not_marked_count: { type: 'number' },
                },
              },
            },
          },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Class not found',
    }),
  );

/**
 * Get Class Term Attendance endpoint
 */
export const ApiGetClassTermAttendance = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get daily attendance summary for a class over a term',
      description:
        'Retrieves aggregated daily attendance statistics for all students in a class ' +
        'over a specified academic term. Returns counts of days present, absent, late, etc. for each student.',
    }),
    ApiParam({
      name: 'classId',
      description: 'Class ID',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiQuery({
      name: 'session_id',
      required: true,
      type: String,
      description: 'Academic session ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiQuery({
      name: 'term',
      required: true,
      enum: ['FIRST', 'SECOND', 'THIRD'],
      description: 'Academic term',
      example: 'FIRST',
    }),
    ApiOkResponse({
      description: 'Class term attendance summary retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: ATTENDANCE_RECORDS_RETRIEVED,
          },
          status_code: { type: 'number', example: 200 },
          data: {
            type: 'object',
            properties: {
              class_id: { type: 'string' },
              session_id: { type: 'string' },
              term: { type: 'string', enum: ['FIRST', 'SECOND', 'THIRD'] },
              start_date: { type: 'string', example: '2025-09-01' },
              end_date: { type: 'string', example: '2025-12-31' },
              students: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    student_id: { type: 'string' },
                    first_name: { type: 'string' },
                    middle_name: { type: 'string' },
                    last_name: { type: 'string' },
                    total_school_days: { type: 'number' },
                    days_present: {
                      type: 'number',
                      description:
                        'Total days student attended school (includes both on-time and late)',
                    },
                    days_absent: {
                      type: 'number',
                      description: 'Number of days student was absent',
                    },
                    days_excused: {
                      type: 'number',
                      description:
                        'Number of days student was absent but excused',
                    },
                    attendance_details: {
                      type: 'array',
                      description: 'Detailed attendance records for each day',
                      items: {
                        type: 'object',
                        properties: {
                          date: { type: 'string', example: '2025-09-01' },
                          status: {
                            type: 'string',
                            enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'],
                            example: 'PRESENT',
                          },
                          was_late: {
                            type: 'boolean',
                            description:
                              'True if student was late (status = LATE)',
                          },
                        },
                      },
                    },
                  },
                },
              },
              summary: {
                type: 'object',
                properties: {
                  total_students: { type: 'number' },
                  total_school_days: { type: 'number' },
                },
              },
            },
          },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Class or term not found',
    }),
  );

/**
 * Update Student Daily Attendance endpoint
 */
export const ApiUpdateStudentDailyAttendance = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update a student daily attendance record (Teacher only)',
      description:
        'Updates the status or notes of an existing daily attendance record. ' +
        'Check-in and check-out times are automatically managed by the system.',
    }),
    ApiParam({
      name: 'id',
      description: 'Daily attendance record ID',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiBody({
      type: UpdateStudentDailyAttendanceDto,
      description: 'Update daily attendance payload',
      examples: {
        updateStatus: {
          summary: 'Change status',
          value: {
            status: 'HALF_DAY',
            notes: 'Medical appointment',
          },
        },
        updateNotes: {
          summary: 'Update notes only',
          value: {
            notes: 'Student arrived late due to traffic',
          },
        },
      },
    }),
    ApiOkResponse({
      description: 'Student daily attendance updated successfully',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: ATTENDANCE_UPDATED_SUCCESSFULLY,
          },
          status_code: { type: 'number', example: 200 },
          data: { $ref: '#/components/schemas/AttendanceResponseDto' },
        },
      },
    }),
    ApiNotFoundResponse({
      description: ATTENDANCE_NOT_FOUND,
    }),
  );

/**
 * Get Student Term Attendance Summary endpoint
 */
export const ApiGetStudentTermSummary = () =>
  applyDecorators(
    ApiOperation({
      summary:
        'Get student term attendance summary (Student for self, Teacher/Admin for any)',
      description:
        'Retrieves aggregate attendance statistics for a student over a specific academic term. ' +
        'Returns total school days (weekdays only), days present (including late), and days absent. ' +
        'Students can only view their own summary; teachers and admins can view any student.',
    }),
    ApiParam({
      name: 'studentId',
      description: 'Student ID',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiQuery({
      name: 'session_id',
      required: true,
      type: String,
      description: 'Academic session ID',
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    ApiQuery({
      name: 'term',
      required: true,
      enum: ['First term', 'Second term', 'Third term'],
      description: 'Term name (First term, Second term, or Third term)',
      example: 'First term',
    }),
    ApiOkResponse({
      description: 'Student term attendance summary retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Attendance records retrieved successfully',
          },
          status_code: { type: 'number', example: 200 },
          data: {
            type: 'object',
            properties: {
              total_school_days: {
                type: 'number',
                example: 120,
                description:
                  'Total number of school days (weekdays) in the term',
              },
              days_present: {
                type: 'number',
                example: 113,
                description:
                  'Number of days student was present (includes late)',
              },
              days_absent: {
                type: 'number',
                example: 7,
                description: 'Number of days student was absent',
              },
            },
          },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Student or term not found',
    }),
    ApiForbiddenResponse({
      description: 'Students can only view their own attendance summary',
    }),
  );
