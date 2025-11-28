import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSubjectDto {
  @ApiProperty({
    description: 'Subject name (must be unique)',
    example: 'Biology',
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'Subject name is required.' })
  @IsString({ message: 'Subject name must be a string.' })
  @MaxLength(255, { message: 'Subject name cannot exceed 255 characters.' })
  name: string;
}
