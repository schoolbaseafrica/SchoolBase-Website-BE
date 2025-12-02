import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsUUID, IsInt, Min } from 'class-validator';

export class ListClassSubjectQueryDto {
  @ApiPropertyOptional({
    description: 'Filter class subjects by class ID',
    example: 'b2d4f0c8-9d1f-4e0d-9c9f-25e598d9d332',
  })
  @IsOptional()
  @IsUUID()
  class_id?: string;

  @ApiPropertyOptional({
    description: 'Filter class subjects by subject ID',
    example: '8c0eee03-6111-466b-95a1-810c2aab97b7',
  })
  @IsOptional()
  @IsUUID()
  subject_id?: string;

  @ApiPropertyOptional({
    description: 'Filter class subjects by teacher ID',
    example: 'a132889a-1366-48e0-907d-a34843ecfbb0',
  })
  @IsOptional()
  @IsUUID()
  teacher_id?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page for pagination',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
