import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectSubmissionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({
    description: 'Reason for rejection',
  })
  reason: string;
}
