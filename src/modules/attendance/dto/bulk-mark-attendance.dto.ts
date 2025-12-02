import { ApiProperty } from '@nestjs/swagger';
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

import { AttendanceStatus } from '../enums';

export class StudentAttendanceDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Student ID',
  })
  @IsUUID()
  student_id: string;

  @ApiProperty({
    enum: AttendanceStatus,
    example: AttendanceStatus.PRESENT,
    description: 'Attendance status',
  })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiProperty({
    example: 'Late due to medical appointment',
    required: false,
    description: 'Optional notes about attendance',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class BulkMarkAttendanceDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Schedule ID (timetable period)',
  })
  @IsUUID()
  schedule_id: string;

  @ApiProperty({
    example: '2025-09-20',
    description: 'Attendance date (YYYY-MM-DD)',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    type: [StudentAttendanceDto],
    description: 'List of student attendance records',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceDto)
  attendance_records: StudentAttendanceDto[];
}
