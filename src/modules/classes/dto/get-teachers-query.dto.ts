import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetTeachersQueryDto {
  @ApiPropertyOptional({
    description:
      'The academic session ID (e.g., "2023-2024"). Defaults to active session if omitted.',
    example: '2023-2024',
  })
  @IsOptional()
  @IsString()
  session_id?: string;
}
