import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class SubjectLineDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  subject: {
    id: string;
    name: string;
  };

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
  remark: string | null;
}

export class StudentInfoDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  registration_number: string;

  @ApiPropertyOptional()
  @Expose()
  name?: string;
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

export class SessionInfoDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiPropertyOptional()
  @Expose()
  academicYear?: string;
}

export class ClassStatisticsDto {
  @ApiPropertyOptional()
  @Expose()
  highest_score?: number | null;

  @ApiPropertyOptional()
  @Expose()
  lowest_score?: number | null;

  @ApiPropertyOptional()
  @Expose()
  class_average?: number | null;

  @ApiPropertyOptional()
  @Expose()
  total_students?: number;
}

export class ResultResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty({ type: StudentInfoDto })
  @Expose()
  @Type(() => StudentInfoDto)
  student: StudentInfoDto;

  @ApiProperty({ type: ClassInfoDto })
  @Expose()
  @Type(() => ClassInfoDto)
  class: ClassInfoDto;

  @ApiProperty({ type: TermInfoDto })
  @Expose()
  @Type(() => TermInfoDto)
  term: TermInfoDto;

  @ApiProperty({ type: SessionInfoDto })
  @Expose()
  @Type(() => SessionInfoDto)
  academicSession: SessionInfoDto;

  @ApiPropertyOptional()
  @Expose()
  total_score: number | null;

  @ApiPropertyOptional()
  @Expose()
  average_score: number | null;

  @ApiPropertyOptional()
  @Expose()
  grade_letter: string | null;

  @ApiPropertyOptional()
  @Expose()
  position: number | null;

  @ApiPropertyOptional()
  @Expose()
  remark: string | null;

  @ApiProperty()
  @Expose()
  subject_count: number;

  @ApiProperty({ type: [SubjectLineDto] })
  @Expose()
  @Type(() => SubjectLineDto)
  subject_lines: SubjectLineDto[];

  @ApiPropertyOptional({ type: ClassStatisticsDto })
  @Expose()
  @Type(() => ClassStatisticsDto)
  class_statistics?: ClassStatisticsDto;

  @ApiPropertyOptional()
  @Expose()
  generated_at: Date | null;

  @ApiProperty()
  @Expose()
  created_at: Date;

  @ApiProperty()
  @Expose()
  updated_at: Date;
}
