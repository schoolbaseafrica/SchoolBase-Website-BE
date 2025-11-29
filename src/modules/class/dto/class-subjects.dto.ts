import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClassSubjectTeacher {
  @ApiProperty({ example: '5f3c0f9a-2b76-4c4d-a384-dbfcb425e9bf' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;
}

export class ClassSubject {
  @ApiProperty({ example: 'd9822cd7-abb9-4a77-8ac1-77e0dfac8a44' })
  id: string;

  @ApiProperty({ example: 'Mathematics' })
  name: string;
}

export class ClassSubjectResponseDto {
  @ApiPropertyOptional({ example: 'Class subject fetched successfully' })
  message?: string;

  @ApiProperty({ example: 'c3b853e1-6f82-47e9-9a50-86c17738e8cb' })
  id: string;

  @ApiProperty({ type: ClassSubject })
  subject: ClassSubject;

  @ApiProperty({ type: ClassSubjectTeacher })
  teacher: ClassSubjectTeacher;

  @ApiPropertyOptional({ example: '2025-01-10T15:32:00.000Z' })
  teacher_assignment_date?: Date;

  @ApiProperty({ example: '2025-01-10T14:12:30.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2025-01-10T14:12:30.000Z' })
  updated_at: Date;

  constructor(partial: Partial<ClassSubjectResponseDto>) {
    Object.assign(this, partial);
  }
}
