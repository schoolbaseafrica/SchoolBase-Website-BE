import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsUUID,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';

import { DailyAttendanceStatus } from '../enums';

// ==================== STUDENT DAILY ATTENDANCE ====================

export class StudentDailyAttendanceRecordDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  student_id: string;

  @ApiProperty({
    enum: DailyAttendanceStatus,
    example: DailyAttendanceStatus.PRESENT,
  })
  @IsEnum(DailyAttendanceStatus)
  status: DailyAttendanceStatus;

  @ApiPropertyOptional({ example: 'Student arrived late due to traffic' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class MarkStudentDailyAttendanceDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Class ID',
  })
  @IsUUID()
  class_id: string;

  @ApiProperty({
    example: '2025-12-02',
    description: 'Date in YYYY-MM-DD format',
  })
  @IsDateString()
  date: string;

  @ApiProperty({ type: [StudentDailyAttendanceRecordDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentDailyAttendanceRecordDto)
  attendance_records: StudentDailyAttendanceRecordDto[];
}

// ==================== UPDATE DTOs ====================

export class UpdateStudentDailyAttendanceDto {
  @ApiPropertyOptional({ enum: DailyAttendanceStatus })
  @IsOptional()
  @IsEnum(DailyAttendanceStatus)
  status?: DailyAttendanceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
