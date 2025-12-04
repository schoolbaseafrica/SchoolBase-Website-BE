import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsUUID } from 'class-validator';

export class ListResultsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by academic term ID' })
  @IsOptional()
  @IsUUID()
  term_id?: string;

  @ApiPropertyOptional({ description: 'Filter by academic session ID' })
  @IsOptional()
  @IsUUID()
  academic_session_id?: string;

  @ApiPropertyOptional({ description: 'Filter by class ID' })
  @IsOptional()
  @IsUUID()
  class_id?: string;

  @ApiPropertyOptional({ description: 'Page number (default: 1)' })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page (default: 10)' })
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
