import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class StudentInfoDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  registration_number: string;
}

export class GradeResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty({ type: StudentInfoDto })
  @Expose()
  @Type(() => StudentInfoDto)
  student: StudentInfoDto;

  @ApiPropertyOptional()
  @Expose()
  ca_score: number | null;

  @ApiPropertyOptional()
  @Expose()
  exam_score: number | null;

  @ApiPropertyOptional()
  @Expose()
  total_score: number | null;

  @ApiPropertyOptional()
  @Expose()
  grade_letter: string | null;

  @ApiPropertyOptional()
  @Expose()
  comment: string | null;
}

export class SubjectInfoDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;
}

export class ClassInfoDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiPropertyOptional()
  @Expose()
  arm?: string;
}

export class TermInfoDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;
}

export class TeacherInfoDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiPropertyOptional()
  @Expose()
  title?: string;
}

export class GradeSubmissionResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty({ type: TeacherInfoDto })
  @Expose()
  @Type(() => TeacherInfoDto)
  teacher: TeacherInfoDto;

  @ApiProperty({ type: ClassInfoDto })
  @Expose()
  @Type(() => ClassInfoDto)
  class: ClassInfoDto;

  @ApiProperty({ type: SubjectInfoDto })
  @Expose()
  @Type(() => SubjectInfoDto)
  subject: SubjectInfoDto;

  @ApiProperty({ type: TermInfoDto })
  @Expose()
  @Type(() => TermInfoDto)
  term: TermInfoDto;

  @ApiProperty()
  @Expose()
  status: string;

  @ApiProperty()
  @Expose()
  student_count: number;

  @ApiPropertyOptional()
  @Expose()
  submitted_at: Date | null;

  @ApiPropertyOptional()
  @Expose()
  reviewed_at: Date | null;

  @ApiPropertyOptional()
  @Expose()
  rejection_reason: string | null;

  @ApiProperty({ type: [GradeResponseDto] })
  @Expose()
  @Type(() => GradeResponseDto)
  grades: GradeResponseDto[];

  @ApiProperty()
  @Expose()
  created_at: Date;

  @ApiProperty()
  @Expose()
  updated_at: Date;
}
