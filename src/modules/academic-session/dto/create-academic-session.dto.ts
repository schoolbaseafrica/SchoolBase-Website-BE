import { IsDateString, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateAcademicSessionDto {
  // 3. Session name cannot be empty.
  @IsNotEmpty({ message: 'Session name is required.' })
  @IsString({ message: 'Session name must be a string.' })
  @MaxLength(100, { message: 'Session name cannot exceed 100 characters.' })
  name: string;

  // Uses ISO date string for validation. Service will convert to Date object.
  @IsNotEmpty({ message: 'Start date is required.' })
  @IsDateString(
    { strict: true },
    { message: 'Start date must be a valid ISO date string (YYYY-MM-DD).' },
  )
  startDate: string;

  @IsNotEmpty({ message: 'End date is required.' })
  @IsDateString(
    { strict: true },
    { message: 'End date must be a valid ISO date string (YYYY-MM-DD).' },
  )
  endDate: string;
}
