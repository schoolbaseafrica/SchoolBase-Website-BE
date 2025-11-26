import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

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
}

export class GroupedClassDto {
  @ApiProperty()
  name: string;

  @ApiProperty({ type: () => AcademicSessionDto })
  academicSession: AcademicSessionDto;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        arm: { type: 'string', nullable: true },
      },
    },
  })
  classes: { id: string; arm?: string }[];
}
