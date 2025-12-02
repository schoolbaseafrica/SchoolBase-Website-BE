import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { AttendanceStatus } from '../enums';

export class AttendanceResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Attendance record ID',
  })
  @Expose()
  id: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Schedule ID (timetable period)',
  })
  @Expose()
  schedule_id: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Student ID',
  })
  @Expose()
  student_id: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Session ID',
  })
  @Expose()
  session_id: string;

  @ApiProperty({
    example: '2025-09-20',
    description: 'Attendance date',
  })
  @Expose()
  date: Date;

  @ApiProperty({
    enum: AttendanceStatus,
    example: AttendanceStatus.PRESENT,
    description: 'Attendance status',
  })
  @Expose()
  status: AttendanceStatus;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of user who marked attendance',
  })
  @Expose()
  marked_by: string;

  @ApiProperty({
    example: '2025-09-20T08:30:00Z',
    description: 'When attendance was marked',
  })
  @Expose()
  marked_at: Date;

  @ApiProperty({
    example: 'Late due to medical appointment',
    required: false,
    description: 'Optional notes',
  })
  @Expose()
  notes: string | null;

  @ApiProperty({
    example: 'John Doe',
    required: false,
    description: 'Student name (if joined)',
  })
  @Expose()
  student_name?: string;

  @ApiProperty({
    example: 'Grade 10A',
    required: false,
    description: 'Class name (if joined)',
  })
  @Expose()
  class_name?: string;

  @ApiProperty({
    example: '2025-09-20T08:00:00Z',
    description: 'Record creation timestamp',
  })
  @Expose()
  created_at: Date;

  @ApiProperty({
    example: '2025-09-20T08:30:00Z',
    description: 'Record update timestamp',
  })
  @Expose()
  updated_at: Date;
}
