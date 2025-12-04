import { HttpStatus } from '@nestjs/common';

import * as sysMessage from '../../../constants/system.messages';
import { AddScheduleDto, GetTimetableResponseDto } from '../dto/timetable.dto';

export const TimetableSwagger = {
  tags: ['Timetables'],
  summary: 'Timetable Management',
  description: 'Endpoints for managing class timetables and schedules.',
  endpoints: {
    addSchedule: {
      operation: {
        summary: 'Add a schedule to a class timetable',
        description:
          'Adds a new schedule entry (lesson, break, etc.) to a specific class timetable. Validates time ranges, overlaps, and teacher availability.',
      },
      body: {
        type: AddScheduleDto,
      },
      responses: {
        created: {
          status: HttpStatus.CREATED,
          description: 'The schedule has been successfully added.',
        },
        badRequest: {
          status: HttpStatus.BAD_REQUEST,
          description: 'Bad Request. Invalid input data or time range.',
        },
        notFound: {
          status: HttpStatus.NOT_FOUND,
          description: 'Not Found. Class, subject, or teacher not found.',
        },
        conflict: {
          status: HttpStatus.CONFLICT,
          description:
            'Conflict. Schedule overlap detected for class or teacher double-booking.',
        },
      },
    },
    findByClass: {
      operation: {
        summary: 'Get timetable by class ID',
        description:
          'Retrieves the complete timetable for a specific class, including all scheduled lessons and breaks.',
      },
      parameters: {
        classId: {
          name: 'classId',
          description: 'The unique identifier of the class',
        },
      },
      responses: {
        ok: {
          status: HttpStatus.OK,
          description: 'Return the timetable for the specified class.',
          type: GetTimetableResponseDto,
        },
        notFound: {
          status: HttpStatus.NOT_FOUND,
          description: 'Timetable not found.',
        },
      },
    },

    findAll: {
      operation: {
        summary: 'Student time table',
        description:
          'all timetables, with support for pagination and optional filtering by day.',
      },
      responses: {
        ok: {
          status: HttpStatus.OK,
          message: sysMessage.OPERATION_SUCCESSFUL,
          description: 'Returns a paginated list of all timetables.',
          type: GetTimetableResponseDto,
        },
        notFound: {
          status: HttpStatus.NOT_FOUND,
          message: sysMessage.OPERATION_FAILED,
          description: 'Timetable not found.',
        },
      },
    },
  },
};
