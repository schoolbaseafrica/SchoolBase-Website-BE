import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateClassDto {
  @ApiProperty({
    example: 'JSS1',
    description: 'The name of the class (e.g., JSS1, SSS2, etc.).',
  })
  @IsNotEmpty({ message: 'Class name cannot be empty' })
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim().replace(/\s+/g, ' ').toUpperCase()
      : value,
  )
  name: string;

  @ApiProperty({
    example: 'A',
    description: 'The arm of the class (e.g., A, B, C, etc.).',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  arm?: string;

  @ApiPropertyOptional({
    type: String,
    isArray: true,
    description: 'Array of teacher IDs to assign to the class (optional)',
    required: false,
    example: ['teacher-uuid-1', 'teacher-uuid-2'],
  })
  @IsOptional()
  @IsString({ each: true })
  teacherIds?: string[];
}

export class AcademicSessionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class ClassResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  arm?: string;

  @ApiProperty({ type: () => AcademicSessionDto, required: false })
  academicSession?: AcademicSessionDto;

  @ApiPropertyOptional({
    type: String,
    isArray: true,
    description: 'Array of teacher IDs assigned to the class',
    required: false,
    example: ['teacher-uuid-1', 'teacher-uuid-2'],
  })
  teacherIds?: string[];
}

export class ClassItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ required: false, nullable: true })
  arm?: string;
}

export class GroupedClassDto {
  @ApiProperty()
  name: string;

  @ApiProperty({ type: () => AcademicSessionDto })
  academicSession: AcademicSessionDto;

  @ApiProperty({
    type: () => ClassItemDto,
    isArray: true,
  })
  classes: ClassItemDto[];
}

export class ListGroupedClassesDto {
  @ApiProperty({
    description: 'Page number',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of records per page',
    example: 20,
    required: false,
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;
}

export class GetTotalClassesQueryDto {
  @ApiPropertyOptional({ description: 'Academic session ID to filter by' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Class name to filter by' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Class arm to filter by' })
  @IsOptional()
  @IsString()
  arm?: string;
}
