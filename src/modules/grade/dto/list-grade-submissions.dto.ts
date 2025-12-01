import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

import { GradeSubmissionStatus } from '../entities/grade-submission.entity';

export class ListGradeSubmissionsDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
  })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 10,
  })
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by class ID',
  })
  @IsOptional()
  @IsUUID()
  class_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by subject ID',
  })
  @IsOptional()
  @IsUUID()
  subject_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by term ID',
  })
  @IsOptional()
  @IsUUID()
  term_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: GradeSubmissionStatus,
  })
  @IsOptional()
  @IsEnum(GradeSubmissionStatus)
  status?: GradeSubmissionStatus;
}
