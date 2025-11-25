import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ParentResponseDto {
  @ApiProperty({
    description: 'Parent ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string; // Parent ID (UUID)

  // Data pulled from the User entity
  @ApiProperty({ description: 'First name', example: 'John' })
  @Expose()
  first_name: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  @Expose()
  last_name: string;

  @ApiProperty({
    description: 'Middle name',
    example: 'Michael',
    required: false,
  })
  @Expose()
  middle_name?: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john.doe@example.com',
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
    example: '1985-05-15',
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
  is_active: boolean;

  @ApiProperty({
    description: 'Photo URL',
    example: '/uploads/parents/parent-123.jpg',
    required: false,
  })
  @Expose()
  photo_url?: string;

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
