import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  MaxLength,
  IsDateString,
  IsBoolean,
  IsOptional,
  Matches,
  IsPhoneNumber,
} from 'class-validator';

import { TeacherTitle } from '../enums/teacher.enum';

export class CreateTeacherDto {
  @ApiProperty({
    description: 'Teacher title',
    enum: TeacherTitle,
    example: TeacherTitle.MISS,
  })
  @IsEnum(TeacherTitle)
  @IsNotEmpty()
  title: TeacherTitle;

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
      'Employment ID (format: EMP-YYYY-XXX, e.g., EMP-2025-014). Auto-generated if not provided.',
    example: 'EMP-2025-014',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^EMP-\d{4}-\d{3}$/, {
    message: 'Employment ID must be in format EMP-YYYY-XXX',
  })
  employment_id?: string;

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
    enum: ['Male', 'Female', 'Other'],
  })
  @IsString()
  @IsNotEmpty()
  gender: string;

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
  @IsPhoneNumber()
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
    example: 'https://example.com/photos/teacher123.jpg',
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
