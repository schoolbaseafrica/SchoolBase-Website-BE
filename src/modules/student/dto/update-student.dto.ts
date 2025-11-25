// import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { Gender } from '../../shared/enums';

export class UpdateStudentDto {
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
    description: 'Email address',
    example: 'favourchinaza110@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @ApiProperty({
    description: 'Gender',
    example: 'Female',
    enum: Gender,
  })
  @IsNotEmpty()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({
    description: 'Date of birth in YYYY-MM-DD format',
    example: '1990-11-23',
  })
  @IsDateString()
  @IsNotEmpty()
  date_of_birth?: string; // YYYY-MM-DD format

  @ApiProperty({
    description: 'Phone number',
    example: '+234 810 942 3124',
  })
  @IsString()
  @IsNotEmpty()
  phone?: string;

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
}

export class PatchStudentDto extends PartialType(UpdateStudentDto) {}
