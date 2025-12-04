import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

import { AttendanceStatus, DailyAttendanceStatus } from '../enums';

export class UpdateAttendanceDto {
  @ApiPropertyOptional({
    enum: [
      ...Object.values(AttendanceStatus),
      ...Object.values(DailyAttendanceStatus),
    ],
    example: AttendanceStatus.PRESENT,
    description:
      'Updated attendance status (for schedule-based or daily attendance)',
  })
  @IsOptional()
  status?: AttendanceStatus | DailyAttendanceStatus;

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
    example: 'Updated: Student arrived late',
    description: 'Updated notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
