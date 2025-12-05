import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { StudentBasicDto } from './student-basic.dto';

// A simple DTO for nested class details
class StudentClassDetailsDto {
  @ApiProperty({ example: 'c3a3c1a9-5e3e-4f7a-b7a7-2f1c0b7a0a0a' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'JSS 1A' })
  @Expose()
  name: string;
}

// A simple DTO for nested academic details
class StudentAcademicDetailsDto {
  @ApiProperty({ example: 'c3a3c1a9-5e3e-4f7a-b7a7-2f1c0b7a0a0a' })
  @Expose()
  id: string;

  @ApiProperty({ example: '2024/2025' })
  @Expose()
  session: string;
}

class StudentClassSubjectDto {
  @ApiProperty({
    example: 'd4a4d2b0-6f4f-5g8b-c8b8-3g2d1c8b1b1b',
    description: 'ID of the class-subject assignment',
  })
  @Expose()
  id: string;

  @ApiProperty({
    example: 'e5b5e3c1-7g5g-6h9c-d9c9-4h3e2d9c2c2c',
    description: 'ID of the subject',
  })
  @Expose()
  subject_id: string;

  @ApiProperty({ example: 'Mathematics', description: 'Name of the subject' })
  @Expose()
  subject_name: string;

  @ApiProperty({
    example: 'f6c6f4d2-8h6h-7i0d-e0d0-5i4f3e0d3d3d',
    description: 'ID of the assigned teacher',
    nullable: true,
  })
  @Expose()
  teacher_id?: string | null;

  @ApiProperty({
    example: 'Mr. John Doe',
    description: 'Name of the assigned teacher',
    nullable: true,
  })
  @Expose()
  teacher_name?: string | null;

  @ApiProperty({
    example: '2024-09-01T08:00:00.000Z',
    description: 'Date the teacher was assigned to the subject',
    nullable: true,
  })
  @Expose()
  teacher_assignment_date?: Date | null;
}

// DTO for timetable details
class StudentTimetableDto {
  @ApiProperty({
    example: 'g7d7g5e3-9i7i-8j1e-f1e1-6j5g4f1e4e4e',
    description: 'ID of the timetable',
  })
  @Expose()
  id: string;
}
// The main DTO for the response
export class StudentProfileDto extends StudentBasicDto {
  @ApiProperty({ type: StudentClassDetailsDto, nullable: true })
  @Expose()
  class_details: StudentClassDetailsDto | null;

  @ApiProperty({ type: StudentAcademicDetailsDto, nullable: true })
  @Expose()
  academic_details: StudentAcademicDetailsDto | null;

  @ApiProperty({ type: [StudentClassSubjectDto], nullable: true })
  @Expose()
  class_subjects: StudentClassSubjectDto[] | null;

  @ApiProperty({ type: StudentTimetableDto, nullable: true })
  @Expose()
  timetable: StudentTimetableDto | null;
}
