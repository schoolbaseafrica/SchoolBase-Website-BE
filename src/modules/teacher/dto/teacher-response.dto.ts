import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class TeacherResponseDto {
  @ApiProperty({ description: 'Teacher ID', example: 1 })
  @Expose()
  id: number; // Teacher ID

  @ApiProperty({
    description: 'Employment ID',
    example: 'EMP-2025-014',
  })
  @Expose()
  employment_id: string;

  @ApiProperty({
    description: 'Title',
    example: 'Miss',
  })
  @Expose()
  title: string;

  // Data pulled from the User entity
  @ApiProperty({ description: 'First name', example: 'Favour' })
  @Expose()
  first_name: string;

  @ApiProperty({ description: 'Last name', example: 'Chinaza' })
  @Expose()
  last_name: string;

  @ApiProperty({
    description: 'Middle name',
    example: 'Chinaza',
    required: false,
  })
  @Expose()
  middle_name?: string;

  @ApiProperty({
    description: 'Email address',
    example: 'favourchinaza110@gmail.com',
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+234 810 942 3124',
  })
  @Expose()
  phone: string;

  @ApiProperty({ description: 'Gender', example: 'Female' })
  @Expose()
  gender: string;

  @ApiProperty({
    description: 'Date of birth',
    example: '1990-11-23',
    type: Date,
  })
  @Expose()
  date_of_birth: Date;

  @ApiProperty({
    description: 'Home address',
    example: '123 Main Street',
    required: false,
  })
  @Expose()
  home_address?: string;

  @ApiProperty({
    description: 'Active status',
    example: true,
  })
  @Expose()
  is_active: boolean; // Crucial for frontend Active/Inactive filter

  @ApiProperty({
    description: 'Photo URL',
    example: '/uploads/teachers/EMP-2025-014.jpg',
    required: false,
  })
  @Expose()
  photo_url?: string;

  // Computed field for display
  @ApiProperty({
    description: 'Full name (computed)',
    example: 'Miss Favour Chinaza',
  })
  @Expose()
  @Transform(({ obj }) => {
    const title = obj.title || '';
    const firstName = obj.first_name || '';
    const lastName = obj.last_name || '';
    return `${title} ${firstName} ${lastName}`.trim();
  })
  full_name: string;

  @ApiProperty({
    description: 'Created at timestamp',
    type: Date,
  })
  @Expose()
  created_at: Date;

  @ApiProperty({
    description: 'Updated at timestamp',
    type: Date,
  })
  @Expose()
  updated_at: Date;
}
