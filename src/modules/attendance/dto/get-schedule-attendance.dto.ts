import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsUUID,
  IsDateString,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';

import { AttendanceStatus } from '../enums';

export class GetScheduleAttendanceQueryDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
    description: 'Filter by schedule ID (timetable period)',
  })
  @IsUUID()
  @IsOptional()
  schedule_id?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
    description: 'Filter by student ID',
  })
  @IsUUID()
  @IsOptional()
  student_id?: string;

  @ApiProperty({
    example: '2025-09-01',
    required: false,
    description: 'Start date for range filter (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @ApiProperty({
    example: '2025-09-30',
    required: false,
    description: 'End date for range filter (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsOptional()
  end_date?: string;

  @ApiProperty({
    enum: AttendanceStatus,
    required: false,
    description: 'Filter by attendance status',
  })
  @IsEnum(AttendanceStatus)
  @IsOptional()
  status?: AttendanceStatus;

  @ApiProperty({
    example: 1,
    required: false,
    description: 'Page number for pagination',
    default: 1,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    example: 20,
    required: false,
    description: 'Number of records per page',
    default: 20,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}
