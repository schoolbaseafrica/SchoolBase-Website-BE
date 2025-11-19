import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateWaitlistDto {
  @ApiProperty({
    example: 'John',
    description: 'First name of the user',
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  first_name: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name of the user',
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  last_name: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address of the user',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
