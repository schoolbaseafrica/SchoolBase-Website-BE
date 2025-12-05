import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsString,
  IsDateString,
  IsNotEmpty,
  MaxLength,
  Matches,
  IsNumber,
  IsOptional,
  Min,
  IsEnum,
} from 'class-validator';

import {
  TeacherDailyAttendanceSourceEnum,
  TeacherDailyAttendanceStatusEnum,
} from '../enums';
import { TeacherManualCheckinStatusEnum } from '../enums/teacher-manual-checkin.enum';

export class CreateTeacherManualCheckinDto {
  @ApiProperty({
    example: '2025-09-20',
    description: 'Checkin date',
    required: true,
    format: 'YYYY-MM-DD',
  })
  @IsDateString({ strict: true })
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    example: '07:30:00',
    description: 'Checkin time',
    format: 'HH:MM:SS',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'check_in_time must be in 24-hour format HH:MM:SS',
  })
  check_in_time: string;

  @ApiProperty({
    example: 'Late due to medical appointment',
    description: 'Reason for checkin',
    required: true,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: 'Reason is required' })
  @MaxLength(255, { message: 'Reason cannot exceed 255 characters' })
  reason: string;
}
export class TeacherManualCheckinResponseDto {
  @ApiProperty({
    example: '2025-09-20',
    description: 'Checkin date',
  })
  @Expose()
  date: string;

  @ApiProperty({
    example: '07:30:00',
    description: 'Checkin time',
  })
  @Expose()
  check_in_time: string;

  @ApiProperty({
    example: 'Late due to medical appointment',
    description: 'Reason for checkin',
  })
  @Expose()
  reason: string;
}

export class ListTeacherCheckinRequestsQueryDto {
  @ApiProperty({
    example: 1,
    description: 'Page number',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    example: 10,
    description: 'Number of items per page',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({
    example: 'PENDING',
    description: 'Status of the checkin request',
    enum: [...Object.values(TeacherManualCheckinStatusEnum)],
  })
  @IsOptional()
  @IsEnum(TeacherManualCheckinStatusEnum)
  status?: TeacherManualCheckinStatusEnum;

  @ApiProperty({
    example: '2025-09-20T07:30:00.000Z',
    description: 'Checkin date',
    required: false,
  })
  @IsOptional()
  @IsDateString({ strict: true })
  check_in_date?: string;
}

export class TeacherCheckinRequestResponseDto extends TeacherManualCheckinResponseDto {
  @ApiProperty({
    example: '2025-09-20T07:30:00.000Z',
    description: 'Submitted at',
  })
  @Expose()
  submitted_at: string;
}

// --- TODAY SUMMARY RESPONSE DTO ---
export class TeacherAttendanceTodaySummaryResponseDto {
  @ApiProperty({ example: '2025-12-05' })
  @Expose()
  date: Date;

  @ApiProperty({
    example: 'PRESENT',
    enum: TeacherDailyAttendanceStatusEnum,
    nullable: true,
    description: 'null if no attendance record',
  })
  @Expose()
  status: TeacherDailyAttendanceStatusEnum | null;

  @ApiProperty({ example: '2025-12-05T08:00:00Z', nullable: true })
  @Expose()
  check_in_time: Date | null;

  @ApiProperty({ example: '2025-12-05T17:00:00Z', nullable: true })
  @Expose()
  check_out_time: Date | null;

  @ApiProperty({ example: 8.5, nullable: true })
  @Expose()
  total_hours: number | null;

  @ApiProperty({
    example: 'MANUAL',
    enum: TeacherDailyAttendanceSourceEnum,
    nullable: true,
  })
  @Expose()
  source: TeacherDailyAttendanceSourceEnum | null;

  @ApiProperty({ example: true })
  @Expose()
  has_attendance: boolean;

  @ApiProperty({ example: false })
  @Expose()
  is_checked_out: boolean;

  @ApiProperty({ example: false })
  @Expose()
  has_pending_request: boolean;
}
