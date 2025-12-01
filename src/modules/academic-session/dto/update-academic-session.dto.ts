import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAcademicSessionDto {
  @ApiPropertyOptional({
    description: 'Optional description for the academic session.',
    example: 'Updated description for the academic session.',
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string.' })
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters.' })
  description?: string;
}
