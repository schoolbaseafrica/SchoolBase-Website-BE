import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

export const UnassignRoomDocs = () => {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Unassign room from schedule',
      description:
        'Removes the room assignment from an existing schedule. The schedule will continue to exist but without a room assigned.',
    }),
    ApiParam({
      name: 'schedule_id',
      description: 'The unique identifier of the schedule',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Room unassigned successfully',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Room unassigned successfully',
          },
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
          room_id: {
            type: 'string',
            nullable: true,
            example: null,
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Schedule not found',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
    }),
  );
};
