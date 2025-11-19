import { IsEmail, IsNotEmpty } from 'class-validator';

export class GetProfileDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
