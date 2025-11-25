import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

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
  })
  @IsNotEmpty({ message: 'Arm is required' })
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  arm: string;
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

  @ApiProperty()
  arm: string;

  @ApiProperty({ type: () => AcademicSessionDto, required: false })
  academicSession?: AcademicSessionDto;
}
