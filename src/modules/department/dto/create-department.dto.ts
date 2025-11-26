import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({
    description: 'Department name',
    example: 'Science',
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'Department name is required.' })
  @IsString({ message: 'Department name must be a string.' })
  @MaxLength(255, { message: 'Department name cannot exceed 255 characters.' })
  name: string;
}
