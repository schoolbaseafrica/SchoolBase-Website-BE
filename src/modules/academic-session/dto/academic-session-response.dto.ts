import { ApiProperty } from '@nestjs/swagger';

import { TermResponseDto } from '../../academic-term/dto/academic-term-response.dto';

export class AcademicSessionResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique ID of the academic session',
  })
  id: string;

  @ApiProperty({
    example: '2025/2026',
    description: 'Academic year (used as session name)',
  })
  academicYear: string;

  @ApiProperty({
    example: 'Academic session for the 2025/2026 school year',
    description: 'Optional description of the session',
    required: false,
  })
  description?: string;

  @ApiProperty({
    example: 'Active',
    description: 'Status of the session',
    enum: ['Active', 'Archived'],
  })
  status: string;

  @ApiProperty({
    type: [TermResponseDto],
    description: 'Array of the 3 terms associated with this session',
    example: [
      {
        id: 'term-1-id',
        name: 'First Term',
        startDate: '2025-09-01',
        endDate: '2025-12-15',
        status: 'Active',
      },
      {
        id: 'term-2-id',
        name: 'Second Term',
        startDate: '2026-01-10',
        endDate: '2026-04-20',
        status: 'Active',
      },
      {
        id: 'term-3-id',
        name: 'Third Term',
        startDate: '2026-05-05',
        endDate: '2026-07-25',
        status: 'Active',
      },
    ],
  })
  terms: TermResponseDto[];

  @ApiProperty({
    example: '2025-09-01',
    description: 'Start date of the session (same as first term start date)',
  })
  startDate: string;

  @ApiProperty({
    example: '2026-07-25',
    description: 'End date of the session (same as third term end date)',
  })
  endDate: string;

  @ApiProperty({
    example: '2025/2026',
    description: 'Name of the session (same as academic year)',
  })
  name: string;

  @ApiProperty({
    example: '2025-01-15T10:30:00.000Z',
    description: 'Timestamp when the session was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-01-15T10:30:00.000Z',
    description: 'Timestamp when the session was last updated',
  })
  updatedAt: Date;
}
