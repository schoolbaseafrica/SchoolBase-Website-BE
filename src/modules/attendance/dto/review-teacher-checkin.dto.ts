import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsNotEmpty, IsEnum, ValidateIf } from 'class-validator';

import { TeacherDailyAttendanceDecisionEnum } from '../enums';

export class ReviewTeacherManualCheckinDto {
  @ApiProperty({
    example: 'APPROVED',
    description: 'Decision to approve or reject the checkin',
    required: true,
    enum: [...Object.values(TeacherDailyAttendanceDecisionEnum)],
  })
  @IsEnum(TeacherDailyAttendanceDecisionEnum)
  @IsNotEmpty()
  decision: TeacherDailyAttendanceDecisionEnum;

  @ApiProperty({
    example: 'Request does not meet criteria',
    description: 'Required when rejecting',
    required: false,
  })
  @ValidateIf((o) => o.decision === TeacherDailyAttendanceDecisionEnum.REJECTED)
  @IsNotEmpty({ message: 'Review notes required when rejecting' })
  @IsString()
  review_notes?: string;
}
export class ReviewTeacherManualCheckinResponseDto {
  @ApiProperty({
    example: 'APPROVED',
    description: 'Decision to approve or reject the checkin',
    enum: [...Object.values(TeacherDailyAttendanceDecisionEnum)],
  })
  @Expose()
  decision: TeacherDailyAttendanceDecisionEnum;
}
