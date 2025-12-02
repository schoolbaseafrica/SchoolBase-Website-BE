import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional } from 'class-validator';

import { AttendanceStatus } from '../enums';

export class UpdateAttendanceDto {
  @ApiProperty({
    enum: AttendanceStatus,
    example: AttendanceStatus.PRESENT,
    description: 'Updated attendance status',
    required: false,
  })
  @IsEnum(AttendanceStatus)
  @IsOptional()
  status?: AttendanceStatus;

  @ApiProperty({
    example: 'Updated: Student arrived late',
    required: false,
    description: 'Updated notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
