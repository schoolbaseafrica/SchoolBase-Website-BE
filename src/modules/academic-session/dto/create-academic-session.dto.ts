import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
  IsOptional,
} from 'class-validator';

import { CreateTermDto } from '../../academic-term/dto/create-term.dto';

export class SessionTerms {
  @ApiProperty({
    description: 'Details for the first academic term.',
    example: {
      startDate: '2025-09-01',
      endDate: '2025-12-15',
    },
  })
  @ValidateNested()
  @Type(() => CreateTermDto)
  @IsNotEmpty({ message: 'First term is required.' })
  first_term: CreateTermDto;

  @ApiProperty({
    description: 'Details for the second academic term.',
    example: {
      startDate: '2026-01-10',
      endDate: '2026-04-20',
    },
  })
  @ValidateNested()
  @Type(() => CreateTermDto)
  @IsNotEmpty({ message: 'Second term is required.' })
  second_term: CreateTermDto;

  @ApiProperty({
    description: 'Details for the third academic term.',
    example: {
      startDate: '2026-05-05',
      endDate: '2026-07-25',
    },
  })
  @ValidateNested()
  @Type(() => CreateTermDto)
  @IsNotEmpty({ message: 'Third term is required.' })
  third_term: CreateTermDto;
}

export class CreateAcademicSessionDto {
  @ApiPropertyOptional({
    description: 'Optional description for the academic session.',
    example: 'This session marks the beginning of the new academic year.',
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string.' })
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters.' })
  description?: string;

  @ApiProperty({
    description: 'Object containing all three academic terms.',
    example: {
      first_term: {
        startDate: '2025-09-01',
        endDate: '2025-12-15',
      },
      second_term: {
        startDate: '2026-01-10',
        endDate: '2026-04-20',
      },
      third_term: {
        startDate: '2026-05-05',
        endDate: '2026-07-25',
      },
    },
  })
  @IsNotEmpty({ message: 'Terms object is required.' })
  @ValidateNested()
  @Type(() => SessionTerms)
  terms: SessionTerms;
}
