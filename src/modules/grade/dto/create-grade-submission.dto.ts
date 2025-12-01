import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class StudentGradeDto {
  @ApiProperty({
    description: 'Student ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  student_id: string;

  @ApiPropertyOptional({
    description: 'Continuous Assessment score (0-30)',
    example: 25,
    minimum: 0,
    maximum: 30,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'CA score must be at least 0' })
  @Max(30, { message: 'CA score cannot exceed 30' })
  ca_score?: number;

  @ApiPropertyOptional({
    description: 'Exam score (0-70)',
    example: 55,
    minimum: 0,
    maximum: 70,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Exam score must be at least 0' })
  @Max(70, { message: 'Exam score cannot exceed 70' })
  exam_score?: number;

  @ApiPropertyOptional({
    description: 'Additional comment for this student (max 20 words)',
    example: 'Good performance in class',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  comment?: string;
}

export class CreateGradeSubmissionDto {
  @ApiProperty({
    description: 'Class ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  class_id: string;

  @ApiProperty({
    description: 'Subject ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  subject_id: string;

  @ApiProperty({
    description: 'Term ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  term_id: string;

  @ApiProperty({
    description: 'Academic Session ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  academic_session_id: string;

  @ApiProperty({
    description: 'Array of student grades',
    type: [StudentGradeDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentGradeDto)
  grades: StudentGradeDto[];
}
