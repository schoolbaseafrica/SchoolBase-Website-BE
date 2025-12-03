import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class GenerateResultDto {
  @ApiProperty({ description: 'Academic term ID' })
  @IsNotEmpty()
  @IsUUID()
  term_id: string;

  @ApiPropertyOptional({
    description: 'Academic session ID (optional if using current session)',
  })
  @IsOptional()
  @IsUUID()
  academic_session_id?: string;

  @ApiPropertyOptional({
    description: 'Class ID (required for class-level generation)',
  })
  @IsOptional()
  @IsUUID()
  class_id?: string;

  @ApiPropertyOptional({
    description: 'Student ID (required for single student generation)',
  })
  @IsOptional()
  @IsUUID()
  student_id?: string;
}
