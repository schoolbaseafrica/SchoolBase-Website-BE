import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class FeeStudentResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the student',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'The full name of the student',
    example: 'John Doe',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'The class the student belongs to',
    example: 'JSS 1',
  })
  @Expose()
  class: string;

  @ApiProperty({
    description: 'The academic session of the student',
    example: '2023/2024',
  })
  @Expose()
  session: string;

  @ApiProperty({
    description: 'The unique registration number of the student',
    example: 'OSP/2023/001',
  })
  @Expose()
  registration_number: string;

  @ApiProperty({
    description: 'The URL of the student photo',
    example: 'https://example.com/photo.jpg',
    required: false,
  })
  @Expose()
  photo_url?: string;
}
