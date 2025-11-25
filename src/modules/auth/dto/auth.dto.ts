import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsEmail,
  IsString,
  IsBoolean,
  IsArray,
  IsEnum,
  MinLength,
  Matches,
  IsJWT,
  IsUUID,
} from 'class-validator';

export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
}

export class AuthDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty({
    description: 'User middle name',
    example: 'Michael',
    required: false,
  })
  @IsString()
  middle_name: string;

  @ApiProperty({
    description: 'User gender',
    example: 'Male',
    enum: ['Male', 'Female', 'Other'],
  })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty({
    description: 'Date of birth in YYYY-MM-DD format',
    example: '2000-01-15',
  })
  @IsString()
  @IsNotEmpty()
  dob: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'User roles',
    enum: UserRole,
    isArray: true,
    example: [UserRole.STUDENT],
  })
  @IsArray()
  @IsEnum(UserRole, { each: true })
  @IsNotEmpty()
  role: UserRole[];

  @ApiProperty({
    description: 'User password (minimum 8 characters)',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'Account active status',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean()
  is_active?: boolean = true;
}

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Password reset token',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: 'NewPassword123!',
    description: 'New password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  newPassword: string;
}
export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token with 7 days expiration',
  })
  @IsJWT()
  @IsNotEmpty()
  refresh_token: string;
}

export class AuthMeResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  first_name: string;

  @ApiProperty({ example: 'Doe' })
  last_name: string;

  @ApiProperty({ example: ['STUDENT'], type: [String] })
  role: UserRole[];

  @ApiProperty({ example: 'Michael' })
  middle_name: string;

  @ApiProperty({ example: 'Male' })
  gender: string;

  @ApiProperty({ example: '2000-01-15' })
  dob: string;

  @ApiProperty({ example: '+1234567890' })
  phone: string;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updated_at: Date;
}

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
