import { ApiProperty } from '@nestjs/swagger';

import { ResultResponseDto } from './result-response.dto';

export class PaginatedResultsResponseDto {
  @ApiProperty({
    description: 'Total number of result records available',
    example: 120,
  })
  total: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 6,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'List of result records for the current page',
    type: [ResultResponseDto],
  })
  data: ResultResponseDto[];
}
