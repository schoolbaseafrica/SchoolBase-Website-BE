import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsUUID,
  IsDateString,
  IsArray,
  ValidateNested,
  IsEnum,
  IsString,
  IsOptional,
} from 'class-validator';

import { AttendanceStatus, DailyAttendanceStatus } from '../enums';

export class AttendanceRecordDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Student ID',
  })
  @IsUUID()
  student_id: string;

  @ApiProperty({
    enum: [
      ...Object.values(AttendanceStatus),
      ...Object.values(DailyAttendanceStatus),
    ],
    example: AttendanceStatus.PRESENT,
    description: 'Attendance status',
  })
  @IsEnum([
    ...Object.values(AttendanceStatus),
    ...Object.values(DailyAttendanceStatus),
  ])
  status: AttendanceStatus | DailyAttendanceStatus;

  @ApiPropertyOptional({
    example: '08:30:00',
    description: 'Check-in time (for daily attendance only)',
  })
  @IsString()
  @IsOptional()
  check_in_time?: string;

  @ApiPropertyOptional({
    example: '15:00:00',
    description: 'Check-out time (for daily attendance only)',
  })
  @IsString()
  @IsOptional()
  check_out_time?: string;

  @ApiPropertyOptional({
    example: 'Late due to medical appointment',
    description: 'Optional notes about attendance',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class MarkAttendanceDto {
  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Schedule ID (for schedule-based attendance)',
  })
  @IsUUID()
  @IsOptional()
  schedule_id?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Class ID (for daily attendance)',
  })
  @IsUUID()
  @IsOptional()
  class_id?: string;

  @ApiProperty({
    example: '2025-09-20',
    description: 'Attendance date (YYYY-MM-DD)',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    type: [AttendanceRecordDto],
    description: 'List of student attendance records',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  attendance_records: AttendanceRecordDto[];
}
