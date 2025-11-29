import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { UpdateScheduleDto } from '../dto/timetable.dto';

export const EditScheduleDocs = () => {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Edit an existing schedule',
      description:
        'Updates an existing schedule with the provided data. All schedule fields (day, start_time, end_time, period_type, subject_id, teacher_id, room) can be updated individually or in combination. Validates business rules such as time overlaps and teacher double-booking.',
    }),
    ApiParam({
      name: 'schedule_id',
      description: 'The unique identifier of the schedule to edit',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiBody({
      type: UpdateScheduleDto,
      description: 'The schedule update data',
    }),
    ApiResponse({
      status: 200,
      description: 'Schedule updated successfully',
      schema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          day: {
            type: 'string',
            enum: [
              'MONDAY',
              'TUESDAY',
              'WEDNESDAY',
              'THURSDAY',
              'FRIDAY',
              'SATURDAY',
              'SUNDAY',
            ],
            example: 'MONDAY',
          },
          start_time: {
            type: 'string',
            example: '08:00:00',
          },
          end_time: {
            type: 'string',
            example: '09:00:00',
          },
          period_type: {
            type: 'string',
            enum: ['ACADEMICS', 'BREAK'],
            example: 'ACADEMICS',
          },
          subject_id: {
            type: 'string',
            nullable: true,
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          teacher_id: {
            type: 'string',
            nullable: true,
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          room: {
            type: 'string',
            nullable: true,
            example: 'Room 101',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Invalid data or validation error',
    }),
    ApiResponse({
      status: 404,
      description: 'Schedule not found',
    }),
    ApiResponse({
      status: 409,
      description: 'Conflict - Time overlap or teacher double-booking',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
    }),
  );
};
