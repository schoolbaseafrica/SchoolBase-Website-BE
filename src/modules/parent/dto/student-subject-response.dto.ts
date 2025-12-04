import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class StudentSubjectResponseDto {
  @ApiProperty({ example: 'Mathematics', description: 'Name of the subject' })
  @Expose()
  subject_name: string;

  @ApiProperty({ example: 'John Doe', description: 'Name of the teacher' })
  @Expose()
  teacher_name: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email of the teacher',
  })
  @Expose()
  teacher_email: string;
}
