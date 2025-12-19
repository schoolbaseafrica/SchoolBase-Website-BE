import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsEmail,
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsEmpty,
} from 'class-validator';

export class CreateContactDto {
  @ApiProperty({
    description: 'Full name of the person contacting',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  full_name: string;

  @ApiProperty({
    description: 'Email address for contact',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'School name (optional)',
    example: 'Springfield High School',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  school_name?: string;

  @ApiProperty({
    description: 'Message content',
    example: 'I would like to inquire about your school portal services...',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  message: string;

  @IsEmpty({ message: 'Invalid submission' })
  @IsOptional()
  website?: string;
}
