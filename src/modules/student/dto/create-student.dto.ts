import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { Gender } from '../../shared/enums';

export class CreateStudentDto {
  @ApiProperty({
    description: 'First name',
    example: 'Favour',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  first_name: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Chinaza',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  last_name: string;

  @ApiProperty({
    description: 'Middle name',
    example: 'Chinaza',
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  middle_name?: string;

  @ApiProperty({
    description:
      'Registration number (format: REG-YYYY-XXX, e.g., REG-2025-014). Auto-generated if not provided.',
    example: 'REG-2025-014',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^REG-\d{4}-\d{3}$/, {
    message: 'Registration number must be in format REG-YYYY-XXX',
  })
  registration_number?: string;

  @ApiProperty({
    description: 'Email address',
    example: 'favourchinaza110@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description:
      'Password (minimum 8 characters). Auto-generated if not provided.',
    example: 'emp1234',
    required: false,
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiProperty({
    description: 'Gender',
    example: 'Female',
    enum: Gender,
  })
  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({
    description: 'Date of birth in YYYY-MM-DD format',
    example: '1990-11-23',
  })
  @IsDateString()
  @IsNotEmpty()
  date_of_birth: string; // YYYY-MM-DD format

  @ApiProperty({
    description: 'Phone number',
    example: '+234 810 942 3124',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'Home address',
    example: '123 Main Street, City, State',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  home_address?: string;

  @ApiProperty({
    description: 'Photo URL (must be a valid HTTP/HTTPS URL to an image)',
    example: 'https://example.com/photos/student123.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  photo_url?: string;

  @ApiProperty({
    description: 'Active status',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;
}
