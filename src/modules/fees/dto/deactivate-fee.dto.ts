// dto/deactivate-fee.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DeactivateFeeDto {
  @ApiProperty({
    description: 'Optional reason for deactivating the fee component',
    example: 'No longer applicable for current academic year',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}
