import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  MaxLength,
  IsDateString,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class CreateParentDto {
  @ApiProperty({
    description: 'First name',
    example: 'John',
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
    example: 'Doe',
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
    example: 'Michael',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  middle_name: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description:
      'Password (minimum 8 characters). Auto-generated if not provided.',
    example: 'parent1234',
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
    example: '1985-05-15',
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
    example: 'https://example.com/photos/parent123.jpg',
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
