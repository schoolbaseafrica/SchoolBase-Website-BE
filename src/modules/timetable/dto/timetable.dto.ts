import { PartialType, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsUUID,
  IsString,
  IsDateString,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';

import { DayOfWeek, PeriodType } from '../enums/timetable.enums';

export class CreateScheduleDto {
  @ApiProperty({ enum: DayOfWeek, description: 'Day of the week' })
  @IsEnum(DayOfWeek)
  day: DayOfWeek;

  @ApiProperty({
    example: '08:00:00',
    description: 'Start time in HH:MM:SS format',
  })
  @IsString()
  start_time: string; // Format: HH:MM:SS

  @ApiProperty({
    example: '09:00:00',
    description: 'End time in HH:MM:SS format',
  })
  @IsString()
  end_time: string;

  @ApiPropertyOptional({
    enum: PeriodType,
    default: PeriodType.ACADEMICS,
    description: 'Type of the period',
  })
  @IsEnum(PeriodType)
  @IsOptional()
  period_type?: PeriodType;

  @ApiPropertyOptional({ description: 'Subject ID', example: 'uuid-string' })
  @IsUUID()
  @IsOptional()
  subject_id?: string;

  @ApiPropertyOptional({ description: 'Teacher ID', example: 'uuid-string' })
  @IsUUID()
  @IsOptional()
  teacher_id?: string;

  @ApiPropertyOptional({
    description: 'Room name or number',
    example: 'Room 101',
  })
  @IsString()
  @IsOptional()
  room?: string;
}

export class AddScheduleDto extends CreateScheduleDto {
  @ApiProperty({
    description: 'The unique identifier of the class to add the schedule to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  class_id: string;
}

export class CreateTimetableDto {
  @ApiProperty({ description: 'Class ID', example: 'uuid-string' })
  @IsUUID()
  class_id: string;

  @ApiPropertyOptional({
    description: 'Is the timetable active?',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Exam week schedule',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [CreateScheduleDto], description: 'List of schedules' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateScheduleDto)
  schedules: CreateScheduleDto[];
}

export class UpdateTimetableDto extends PartialType(CreateTimetableDto) {}

export class QueryTimetableDto {
  @ApiPropertyOptional({ description: 'Class ID to filter by' })
  @IsUUID()
  @IsOptional()
  class_id?: string;

  @ApiPropertyOptional({ description: 'Teacher ID to filter by' })
  @IsUUID()
  @IsOptional()
  teacher_id?: string;

  @ApiPropertyOptional({
    enum: DayOfWeek,
    description: 'Day of the week to filter by',
  })
  @IsEnum(DayOfWeek)
  @IsOptional()
  day?: DayOfWeek;

  @ApiPropertyOptional({
    description: 'Specific date to filter by (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsOptional()
  date?: string;
}

export class SubjectResponseDto {
  @ApiProperty({ description: 'Subject ID', example: 'uuid-string' })
  id: string;

  @ApiProperty({ description: 'Subject Name', example: 'Mathematics' })
  name: string;
}

export class TeacherResponseDto {
  @ApiProperty({ description: 'Teacher ID', example: 'uuid-string' })
  id: string;

  @ApiProperty({ description: 'Teacher Title', example: 'Mr.' })
  title: string;

  @ApiProperty({ description: 'First Name', example: 'John' })
  first_name: string;

  @ApiProperty({ description: 'Last Name', example: 'Doe' })
  last_name: string;
}

export class ScheduleResponseDto extends CreateScheduleDto {
  @ApiProperty({
    description: 'The unique identifier of the schedule',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiPropertyOptional({ type: SubjectResponseDto })
  subject?: SubjectResponseDto;

  @ApiPropertyOptional({ type: TeacherResponseDto })
  teacher?: TeacherResponseDto;
}

export class GetTimetableResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the class',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  class_id: string;

  @ApiProperty({
    type: [ScheduleResponseDto],
    description: 'List of schedules associated with the class',
  })
  schedules: ScheduleResponseDto[];
}
