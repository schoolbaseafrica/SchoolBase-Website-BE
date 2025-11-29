import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginSuperadminDto {
  @ApiProperty({
    example: 'johndoe@example.com',
    description: 'the email address of the superadmin',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'SecuredPassword!',
    description: 'the provided password for the superadmin',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
