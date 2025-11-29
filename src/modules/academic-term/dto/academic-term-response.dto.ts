import { ApiProperty } from '@nestjs/swagger';
export class TermResponseDto {
  @ApiProperty({ example: 'term_1_id', description: 'Unique ID of the term' })
  id: string;
  @ApiProperty({ example: 'First Term', description: 'Name of the term' })
  name: string;
  @ApiProperty({ example: '2025-09-01', description: 'Start date of the term' })
  startDate: string;
  @ApiProperty({ example: '2025-12-15', description: 'End date of the term' })
  endDate: string;
  @ApiProperty({ example: 'ACTIVE', description: 'Status of the term' })
  status: string;
}
