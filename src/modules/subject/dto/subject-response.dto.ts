import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AcademicSessionInfoDto {
  @ApiProperty({
    description: 'Academic session ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Academic session name',
    example: '2024/2025 Academic Year',
  })
  @Expose()
  name: string;
}

export class ClassInfoDto {
  @ApiProperty({
    description: 'Class ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Class name',
    example: 'Grade 10',
  })
  @Expose()
  name: string;

  @ApiPropertyOptional({
    description: 'Class arm',
    example: 'A',
  })
  @Expose()
  arm?: string;

  @ApiPropertyOptional({
    description: 'Class stream',
    example: 'Science',
  })
  @Expose()
  stream?: string;

  @ApiPropertyOptional({
    description: 'Academic session information',
    type: () => AcademicSessionInfoDto,
  })
  @Expose()
  academicSession?: AcademicSessionInfoDto;

  @ApiPropertyOptional({
    description: 'Teacher assignment date',
    example: '2024-01-20T08:00:00Z',
  })
  @Expose()
  teacher_assignment_date?: Date | null;
}

export class SubjectResponseDto {
  @ApiProperty({
    description: 'Subject ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Subject name',
    example: 'Biology',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Created at timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  created_at: Date;

  @ApiProperty({
    description: 'Updated at timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  updated_at: Date;

  @ApiPropertyOptional({
    description: 'List of classes assigned to this subject',
    type: [ClassInfoDto],
  })
  @Expose()
  classes?: ClassInfoDto[];
}
