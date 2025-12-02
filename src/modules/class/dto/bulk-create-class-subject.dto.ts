import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class BulkCreateClassSubjectResponseDto {
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

export class BulkCreateClassSubjectRequestDto {
  @ApiProperty({ example: 'class-id' })
  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @ApiProperty({
    type: [String],
    example: ['subj-123', 'subj-456'],
    description: 'List of subject IDs to assign to the class',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  subjectIds: string[];
}
