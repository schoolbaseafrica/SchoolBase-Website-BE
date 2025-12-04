import { ApiProperty } from '@nestjs/swagger';

import { User } from '../../user/entities/user.entity';
import { Student } from '../entities';

export class StudentResponseDto {
  @ApiProperty({
    description: 'Response message',
    example: 'Student created successfully',
  })
  message?: string;

  @ApiProperty({
    description: 'Student ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Registration number',
    example: 'STU-2025-0014',
  })
  registration_number: string;

  @ApiProperty({ description: 'First name', example: 'Favour' })
  first_name: string;

  @ApiProperty({ description: 'Last name', example: 'Chinaza' })
  last_name: string;

  @ApiProperty({
    description: 'Middle name',
    example: 'Chinaza',
    required: false,
  })
  middle_name: string | null;

  @ApiProperty({
    description: 'Full name (computed)',
    example: 'Favour Chinaza',
  })
  full_name: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+234 810 942 3124',
  })
  phone: string;

  @ApiProperty({
    description: 'Email address',
    example: 'chinaza110@gmail.com',
  })
  email: string;

  @ApiProperty({ description: 'Gender', example: 'Female' })
  gender: string;

  @ApiProperty({
    description: 'Date of birth',
    example: '1990-11-23',
    type: Date,
  })
  date_of_birth: Date;

  @ApiProperty({
    description: 'Home address',
    example: '123 Main Street',
    required: false,
  })
  home_address: string;

  @ApiProperty({
    description: 'Active status',
    example: true,
  })
  is_active: boolean;

  @ApiProperty({
    description: 'Photo URL',
    example: 'https://example.com/uploads/students/REG-2025-014.jpg',
    required: false,
  })
  photo_url?: string;

  @ApiProperty({
    description: 'Created at timestamp',
    type: Date,
  })
  created_at: Date;

  @ApiProperty({
    description: 'Updated at timestamp',
    type: Date,
  })
  updated_at: Date;

  constructor(student: Student, user: User, message?: string) {
    this.message = message;
    this.id = student.id;
    this.registration_number = student.registration_number;
    this.phone = user.phone;
    this.first_name = user.first_name;
    this.last_name = user.last_name;
    this.middle_name = user.middle_name;
    this.full_name = [user.first_name, user.middle_name, user.last_name]
      .filter(Boolean)
      .join(' ');
    this.email = user.email;
    this.gender = user.gender;
    this.date_of_birth = user.dob;
    this.home_address = user.homeAddress;
    this.is_active = user.is_active;
    this.photo_url = student.photo_url;
    this.created_at = student.createdAt;
    this.updated_at = student.updatedAt;
  }
}
