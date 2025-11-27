import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSubjectDto {
  @ApiProperty({
    description: 'Subject name (must be unique)',
    example: 'Advanced Biology',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Subject name must be a string.' })
  @MaxLength(255, { message: 'Subject name cannot exceed 255 characters.' })
  name?: string;
}
