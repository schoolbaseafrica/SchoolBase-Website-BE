import { ApiProperty } from '@nestjs/swagger';

import { TermName } from '../../academic-term/entities/term.entity';
import { FeeStatus } from '../enums/fees.enums';

class TermDetails {
  @ApiProperty({ example: 'a9b8c7d6-e5f4-3210-fedc-ba9876543210' })
  id: string;

  @ApiProperty({ enum: TermName, example: TermName.FIRST })
  name: TermName;

  @ApiProperty({ example: '2025-09-01T00:00:00.000Z', format: 'date-time' })
  startDate: Date;

  @ApiProperty({ example: '2025-12-19T00:00:00.000Z', format: 'date-time' })
  endDate: Date;
}

class ClassDetails {
  @ApiProperty({ example: 'c5d4e3f2-g1h0-9876-5432-10abcdef9876' })
  id: string;

  @ApiProperty({ example: 'Primary 1' })
  name: string;
}

export class FeesResponseDto {
  @ApiProperty({ example: 'f1e2d3c4-b5a6-7890-1234-567890abcdef' })
  id: string;

  @ApiProperty({ example: 'Library Fee' })
  component_name: string;

  @ApiProperty({ example: 'Annual contribution for library resources.' })
  description: string;

  @ApiProperty({ example: 2500.0 })
  amount: number;

  @ApiProperty({ type: TermDetails, description: 'The academic term details.' })
  term: TermDetails;

  @ApiProperty({
    type: [ClassDetails],
    description: 'List of classes this fee applies to.',
    isArray: true,
  })
  classes: ClassDetails[];

  @ApiProperty({ enum: FeeStatus, example: FeeStatus.ACTIVE })
  status: FeeStatus;

  @ApiProperty({
    example: 'Admin',
    description: 'User identifier of the creator.',
  })
  created_by: string;

  @ApiProperty({ example: '2025-08-01T10:00:00.000Z', format: 'date-time' })
  created_at: Date;

  @ApiProperty({ example: '2025-08-01T10:00:00.000Z', format: 'date-time' })
  updated_at: Date;
}

export class FeesListResponseDto {
  @ApiProperty({
    type: [FeesResponseDto],
    description: 'Array of fee components.',
    isArray: true,
  })
  fees: FeesResponseDto[];

  @ApiProperty({
    example: 42,
    description: 'Total number of fee components available.',
  })
  total: number;

  @ApiProperty({
    example: 1,
    required: false,
    description: 'Current page number (if paginated).',
  })
  page?: number;

  @ApiProperty({
    example: 20,
    required: false,
    description: 'Items per page (if paginated).',
  })
  limit?: number;
}

export class CreateFeeResponseDto {
  @ApiProperty({ example: 'Fee component created successfully' })
  message: string;

  @ApiProperty({ type: FeesResponseDto })
  data: FeesResponseDto;
}
