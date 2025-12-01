import { ApiProperty } from '@nestjs/swagger';

export class TermResponseDto {
  @ApiProperty({
    example: '5e21e79f-318a-40ba-bd55-5c9031950318',
    description: 'Unique ID of the term',
  })
  id: string;

  @ApiProperty({
    example: 'First term',
    description: 'Name of the term',
    enum: ['First term', 'Second term', 'Third term'],
  })
  name: string;

  @ApiProperty({
    example: '2025-09-01',
    description: 'Start date of the term',
  })
  startDate: string;

  @ApiProperty({
    example: '2025-12-15',
    description: 'End date of the term',
  })
  endDate: string;

  @ApiProperty({
    example: 'Active',
    description: 'Status of the term (Active or Inactive)',
    enum: ['Active', 'Inactive'],
  })
  status: string;

  @ApiProperty({
    example: true,
    description: 'Whether this is the current active term based on date range',
  })
  isCurrent: boolean;

  @ApiProperty({
    example: '2025-11-28T13:38:15.218Z',
    description: 'Timestamp when the term was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-11-28T13:38:15.218Z',
    description: 'Timestamp when the term was last updated',
  })
  updatedAt: Date;
}
