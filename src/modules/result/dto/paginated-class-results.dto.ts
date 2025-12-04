import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { ResultResponseDto, ClassStatisticsDto } from './result-response.dto';

export class PaginationMetaDto {
  @ApiProperty()
  @Expose()
  total: number;

  @ApiProperty()
  @Expose()
  page: number;

  @ApiProperty()
  @Expose()
  limit: number;

  @ApiProperty()
  @Expose()
  total_pages: number;

  @ApiProperty()
  @Expose()
  has_next: boolean;

  @ApiProperty()
  @Expose()
  has_previous: boolean;
}

export class ClassResultsDataDto {
  @ApiProperty({ type: [ResultResponseDto] })
  @Expose()
  @Type(() => ResultResponseDto)
  results: ResultResponseDto[];

  @ApiPropertyOptional({ type: ClassStatisticsDto })
  @Expose()
  @Type(() => ClassStatisticsDto)
  class_statistics: ClassStatisticsDto | null;
}

export class PaginatedClassResultsResponseDto {
  @ApiProperty()
  @Expose()
  message: string;

  @ApiProperty({ type: ClassResultsDataDto })
  @Expose()
  @Type(() => ClassResultsDataDto)
  data: ClassResultsDataDto;

  @ApiProperty({ type: PaginationMetaDto })
  @Expose()
  @Type(() => PaginationMetaDto)
  pagination: PaginationMetaDto;
}
