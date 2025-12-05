import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class AssignStudentsToClassDto {
  @ApiProperty({
    description:
      'Array of student IDs to assign to the class. Students will be assigned to the class in the same academic session the class belongs to.',
    example: ['student-uuid-1', 'student-uuid-2', 'student-uuid-3'],
    type: [String],
  })
  @IsNotEmpty({ message: 'Student IDs array cannot be empty' })
  @IsArray({ message: 'Student IDs must be an array' })
  @ArrayMinSize(1, { message: 'At least one student ID is required' })
  @IsUUID('4', { each: true, message: 'Each student ID must be a valid UUID' })
  studentIds: string[];
}

export class StudentAssignmentResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique identifier of the student (UUID)',
  })
  @Expose()
  student_id: string;

  @ApiProperty({
    example: 'STU-2025-0014',
    description: 'Registration number of the student',
  })
  @Expose()
  registration_number: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the student',
  })
  @Expose()
  name: string;

  @ApiProperty({
    example: '2023-09-01T08:00:00Z',
    description: 'Date when the student was enrolled in the class',
  })
  @Expose()
  enrollment_date: Date;

  @ApiProperty({
    example: true,
    description: 'Whether the student is actively enrolled',
  })
  @Expose()
  is_active: boolean;
}

export class AssignSingleStudentResponseDto {
  @ApiProperty({
    example: 'Student assigned to class successfully.',
    description: 'Success message',
  })
  @Expose()
  message: string;

  @ApiProperty({
    example: true,
    description: 'Whether the student was assigned (new or reactivated)',
  })
  @Expose()
  assigned: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether an existing inactive assignment was reactivated',
  })
  @Expose()
  reactivated: boolean;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The class ID',
  })
  @Expose()
  classId: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'The student ID',
  })
  @Expose()
  studentId: string;
}
