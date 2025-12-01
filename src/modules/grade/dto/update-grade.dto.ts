import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateGradeDto {
  @ApiPropertyOptional({
    description: 'Continuous Assessment score (0-30)',
    example: 25,
    minimum: 0,
    maximum: 30,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'CA score must be at least 0' })
  @Max(30, { message: 'CA score cannot exceed 30' })
  ca_score?: number;

  @ApiPropertyOptional({
    description: 'Exam score (0-70)',
    example: 55,
    minimum: 0,
    maximum: 70,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Exam score must be at least 0' })
  @Max(70, { message: 'Exam score cannot exceed 70' })
  exam_score?: number;

  @ApiPropertyOptional({
    description: 'Additional comment for this student (max 20 words)',
    example: 'Good performance in class',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  comment?: string;
}
