import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsJWT, IsNotEmpty, IsString } from 'class-validator';

import * as sysMsg from '../../../constants/system.messages';

import { isEqualTo } from './password-matching.dto';

export class CreateSuperadminDto {
  @ApiProperty({
    example: 'johndoe@example.com',
    description: 'the email address of the superadmin',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'John',
    description: 'the first name of the superadmin',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'the last name of the superadmin',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: 'The Bells University',
    description: 'the name of the school',
  })
  @IsString()
  @IsNotEmpty()
  schoolName: string;

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
  @isEqualTo('password', { message: sysMsg.SUPERADMIN_PASSWORD_MUST_MATCH })
  @IsString()
  @IsNotEmpty()
  confirm_password: string;
}

export class ActivateSuperAdminDto {
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

export class JwtQueryDto {
  @ApiProperty({
    example: 'JwT7784848fjju47478hfjhgjgfjURed23$$##kkdfhfh',
    description: 'jwt token from the url query',
  })
  @IsJWT()
  @IsNotEmpty()
  jwt: string;
}
