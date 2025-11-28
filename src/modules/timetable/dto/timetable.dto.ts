import { PartialType } from '@nestjs/mapped-types';
import {
  IsEnum,
  IsUUID,
  IsString,
  IsDateString,
  IsBoolean,
  IsOptional,
} from 'class-validator';

import { DayOfWeek, PeriodType } from '../enums/timetable.enums';

export class CreateTimetableDto {
  @IsEnum(DayOfWeek)
  day: DayOfWeek;

  @IsString()
  start_time: string; // Format: HH:MM:SS

  @IsString()
  end_time: string;

  @IsEnum(PeriodType)
  @IsOptional()
  period_type?: PeriodType;

  @IsUUID()
  class_id: string;

  @IsUUID()
  @IsOptional()
  subject_id?: string;

  @IsUUID()
  @IsOptional()
  teacher_id?: string;

  @IsString()
  @IsOptional()
  room?: string;

  @IsDateString()
  effective_date: string;

  @IsDateString()
  @IsOptional()
  end_date?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateTimetableDto extends PartialType(CreateTimetableDto) {}

export class QueryTimetableDto {
  @IsUUID()
  @IsOptional()
  class_id?: string;

  @IsUUID()
  @IsOptional()
  teacher_id?: string;

  @IsEnum(DayOfWeek)
  @IsOptional()
  day?: DayOfWeek;

  @IsDateString()
  @IsOptional()
  date?: string;
}
