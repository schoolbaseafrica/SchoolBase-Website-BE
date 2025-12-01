import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class LogoutDto {
  @ApiProperty({
    example: 'session-id-123',
    description: 'session id',
  })
  @IsUUID()
  @IsNotEmpty()
  session_id: string;

  @ApiProperty({
    example: 'user-id-123',
    description: 'User id',
  })
  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}
