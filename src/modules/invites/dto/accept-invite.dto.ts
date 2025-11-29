import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AcceptInviteDto {
  @ApiProperty({
    example: 'StrongPassword123!',
    description: 'The new password for the account',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({
    description: 'The secure token from the invitation link',
    example: 'a1b2c3d4...',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
