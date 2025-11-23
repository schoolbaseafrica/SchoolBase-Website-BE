import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class TeacherAssignmentResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique identifier of the teacher (UUID)',
  })
  @Expose()
  teacher_id: string;

  @ApiProperty({ example: 'Jane Doe', description: 'Full name of the teacher' })
  @Expose()
  name: string;

  @ApiProperty({
    example: '2023-09-01T08:00:00Z',
    description: 'Date when the teacher was assigned',
  })
  @Expose()
  assignment_date: Date;

  @ApiPropertyOptional({
    example: 'Science',
    description: 'The academic stream of the class (e.g. Science, Arts)',
  })
  @Expose()
  streams?: string;
}
