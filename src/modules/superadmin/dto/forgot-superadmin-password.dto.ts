import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotSuperadminPasswordDto {
  @ApiProperty({
    example: 'johndoe@example.com',
    description: 'the email address of the superadmin',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
