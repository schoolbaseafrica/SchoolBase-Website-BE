import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class CreateTermDto {
  @ApiProperty({
    description: 'Start date of the term in ISO format (YYYY-MM-DD)',
    example: '2025-09-01',
  })
  @IsNotEmpty({ message: 'Term start date is required.' })
  @IsDateString(
    { strict: true },
    { message: 'Start date must be a valid ISO date string (YYYY-MM-DD).' },
  )
  startDate: string;

  @ApiProperty({
    description: 'End date of the term in ISO format (YYYY-MM-DD)',
    example: '2025-12-15',
  })
  @IsNotEmpty({ message: 'Term end date is required.' })
  @IsDateString(
    { strict: true },
    { message: 'End date must be a valid ISO date string (YYYY-MM-DD).' },
  )
  endDate: string;
}
