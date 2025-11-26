import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ListStudentsDto {
  @ApiProperty({
    description: 'Page number',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of records per page',
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @ApiProperty({
    description:
      'Search term (searches in first name, last name, email, registration number)',
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;
}
