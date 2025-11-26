import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class ActivateAcademicSessionDto {
  @ApiProperty({
    description: 'The UUID of the academic session to activate',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty({ message: 'Session ID is required.' })
  @IsUUID('4', { message: 'Session ID must be a valid UUID.' })
  session_id: string;
}
