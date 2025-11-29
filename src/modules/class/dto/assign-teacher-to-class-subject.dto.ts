import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignTeacherToClassSubjectsResponseDto {
  @ApiProperty({ example: '3 subjects successfully assigned' })
  message: string;

  @ApiProperty({
    type: [String],
    example: ['math-id', 'eng-id'],
    description: 'Subjects that were newly assigned to the class',
  })
  assignedSubjects: string[];

  @ApiProperty({
    type: [String],
    example: ['bio-id'],
    description: 'Subjects that were already assigned earlier',
  })
  alreadyAssignedSubjects: string[];

  @ApiProperty({
    type: [String],
    example: ['invalid-id'],
    description: 'Subject IDs that do not exist',
  })
  invalidSubjects: string[];

  constructor(
    message: string,
    assignedSubjects: string[],
    alreadyAssignedSubjects: string[],
    invalidSubjects: string[],
  ) {
    this.message = message;
    this.assignedSubjects = assignedSubjects;
    this.alreadyAssignedSubjects = alreadyAssignedSubjects;
    this.invalidSubjects = invalidSubjects;
  }
}

export class AssignTeacherToClassSubjectRequestDto {
  @ApiProperty({
    type: String,
    example: 'teacher-123',
    description: 'ID of the teacher being assigned',
  })
  @IsUUID()
  @IsNotEmpty()
  teacherId: string;
}
