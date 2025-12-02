import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

import { GradeSubmissionStatus } from '../entities';

import { GradeSubmissionResponseDto } from './grade-response.dto';

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
    description: 'Filter by teacher ID',
  })
  @IsOptional()
  @IsUUID()
  teacher_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: GradeSubmissionStatus,
  })
  @IsOptional()
  @IsEnum(GradeSubmissionStatus)
  status?: GradeSubmissionStatus;
}

export class ListGradeSubmissionsResponseDto {
  @ApiProperty({
    description: 'List of grade submissions',
    type: [GradeSubmissionResponseDto],
  })
  items: GradeSubmissionResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: Object,
    example: {
      total: 100,
      page: 1,
      limit: 10,
      total_pages: 10,
      has_next: true,
      has_previous: false,
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}
