import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsNotEmpty, IsString } from 'class-validator';

export class ResetSuperadminPasswordDto {
  @ApiProperty({
    example: 'jwt-token-received-in-your-email-link',
    description: 'the jwt token, sent to your registered email',
  })
  @IsJWT()
  @IsNotEmpty()
  jwt: string;

  @ApiProperty({
    example: 'SecuredPassword!',
    description: 'the provided password for the superadmin',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: 'SecuredPassword!',
    description:
      'a confirmation copy of the provided password for the superadmin',
  })
  @IsString()
  @IsNotEmpty()
  confirm_password: string;
}
