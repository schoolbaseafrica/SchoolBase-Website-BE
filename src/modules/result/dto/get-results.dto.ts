import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsUUID,
  IsBooleanString,
  IsInt,
  Min,
} from 'class-validator';

export class GetResultsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter results by academic session',
    example: 'dc7d2762-3b32-4c8b-b6ba-5d2fb714a9d1',
  })
  @IsOptional()
  @IsUUID()
  academic_session_id?: string;

  @ApiPropertyOptional({
    description: 'Filter results by term',
    example: 'a23e3eb5-1acd-42b5-9535-e1c3928fe8d2',
  })
  @IsOptional()
  @IsUUID()
  term_id?: string;

  @ApiPropertyOptional({
    description: 'Filter results by class',
    example: '9a61d95c-fde1-4cd4-bf1d-2cff2e2fbf25',
  })
  @IsOptional()
  @IsUUID()
  class_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by student',
    example: '3f59e9b2-f77d-4f9d-92a9-83892bf07d21',
  })
  @IsOptional()
  @IsUUID()
  student_id?: string;

  @ApiPropertyOptional({
    description: 'Whether to include result subject lines for each result',
    example: false,
  })
  @IsOptional()
  @IsBooleanString()
  include_subject_lines?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
