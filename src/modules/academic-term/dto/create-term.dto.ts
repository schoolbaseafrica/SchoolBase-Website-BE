import { IsDateString, IsNotEmpty } from 'class-validator';

export class CreateTermDto {
  @IsNotEmpty({ message: 'Term start date is required.' })
  @IsDateString(
    { strict: true },
    { message: 'Start date must be a valid ISO date string (YYYY-MM-DD).' },
  )
  startDate: string;

  @IsNotEmpty({ message: 'Term end date is required.' })
  @IsDateString(
    { strict: true },
    { message: 'End date must be a valid ISO date string (YYYY-MM-DD).' },
  )
  endDate: string;
}
