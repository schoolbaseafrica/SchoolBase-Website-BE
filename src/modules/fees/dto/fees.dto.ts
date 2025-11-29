import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';

import { FeeStatus } from '../enums/fees.enums';

export class CreateFeesDto {
  @ApiProperty({
    description: 'The unique name/identifier of the fee component.',
    example: 'Tuition Fee',
  })
  @IsString()
  @IsNotEmpty()
  component_name: string;

  @ApiProperty({
    description: 'Optional detailed description of the fee.',
    example: 'Covers all mandatory costs for the current term.',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description:
      'The monetary amount of the fee. Must be a non-negative number.',
    example: 75000.5,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'The unique ID of the academic term this fee belongs to.',
    example: 'a9b8c7d6-e5f4-3210-fedc-ba9876543210',
  })
  @IsString()
  @IsNotEmpty()
  term_id: string;

  @ApiProperty({
    description: 'An array of unique IDs for the classes this fee applies to.',
    example: [
      'c5d4e3f2-g1h0-9876-5432-10abcdef9876',
      'f1e2d3c4-b5a6-7890-1234-567890abcdef',
    ],
    isArray: true,
    type: String,
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  class_ids: string[];
}

export class UpdateFeesDto extends PartialType(CreateFeesDto) {
  @ApiProperty({
    description: 'The current status of the fee (e.g., ACTIVE, DEACTIVATED).',
    enum: FeeStatus,
    example: FeeStatus.INACTIVE,
    required: false,
  })
  @IsEnum(FeeStatus)
  @IsOptional()
  status?: FeeStatus;
}

export class QueryFeesDto {
  @ApiPropertyOptional({
    description:
      'Filter by the fee status. Defaults to ACTIVE if not specified.',
    enum: FeeStatus,
  })
  @IsEnum(FeeStatus)
  @IsOptional()
  status?: FeeStatus;

  @ApiPropertyOptional({
    description: 'Filter fees by a specific class ID.',
    example: 'f1e2d3c4-b5a6-7890-1234-567890abcdef',
  })
  @IsString()
  @IsOptional()
  class_id?: string;

  @ApiPropertyOptional({
    description: 'Filter fees by a specific academic term ID.',
    example: 'a9b8c7d6-e5f4-3210-fedc-ba9876543210',
  })
  @IsString()
  @IsOptional()
  term_id?: string;

  @ApiPropertyOptional({
    description: 'Search term for filtering by component name or description.',
    example: 'tuition',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page for pagination',
    default: 20,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
