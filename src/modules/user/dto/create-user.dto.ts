import {
  IsNotEmpty,
  IsEmail,
  IsString,
  IsBoolean,
  IsArray,
  IsEnum,
  MinLength,
  IsOptional,
} from 'class-validator';

export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsString()
  @IsOptional()
  middle_name?: string;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsString()
  @IsNotEmpty()
  dob: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsArray()
  @IsEnum(UserRole, { each: true })
  @IsNotEmpty()
  role: UserRole[];

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsBoolean()
  is_active?: boolean = true;

  @IsString()
  @IsOptional()
  google_id?: string;

  @IsBoolean()
  @IsOptional()
  is_verified?: boolean;
}
