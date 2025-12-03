import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class StudentBasicDto {
  @ApiProperty({
    description: 'Student ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Student registration number',
    example: 'STU-2025-0001',
  })
  @Expose()
  registration_number: string;

  @ApiProperty({
    description: 'Student first name',
    example: 'John',
  })
  @Expose()
  first_name: string;

  @ApiProperty({
    description: 'Student last name',
    example: 'Doe',
  })
  @Expose()
  last_name: string;

  @ApiProperty({
    description: 'Student middle name',
    example: 'Michael',
    required: false,
  })
  @Expose()
  middle_name?: string;

  @ApiProperty({
    description: 'Student full name',
    example: 'John Michael Doe',
  })
  @Expose()
  full_name: string;

  @ApiProperty({
    description: 'Student photo URL',
    example: 'https://example.com/photos/student.jpg',
    required: false,
  })
  @Expose()
  photo_url?: string;
}
