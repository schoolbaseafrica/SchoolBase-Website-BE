import { ApiProperty } from '@nestjs/swagger';

class UserDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  first_name: string;

  @ApiProperty({ example: 'Doe' })
  last_name: string;

  @ApiProperty({ example: ['STUDENT'], type: [String] })
  role: string[];
}

export class TokensDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token with 15 minutes expiration',
  })
  access_token: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token with 7 days expiration',
  })
  refresh_token: string;
}

export class SignupResponseDto extends TokensDto {
  @ApiProperty({
    example: '201',
    nullable: true,
  })
  status_code?: number;

  @ApiProperty({
    example: 'account created',
    nullable: true,
  })
  message?: string;

  @ApiProperty({ type: UserDto })
  user: UserDto;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    nullable: true,
  })
  session_id?: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    nullable: true,
  })
  session_expires_at?: Date;
}

export class LoginResponseDto extends TokensDto {
  @ApiProperty({
    example: '200',
    nullable: true,
  })
  status_code?: number;

  @ApiProperty({
    example: 'Login success',
    nullable: true,
  })
  message?: string;

  @ApiProperty({ type: UserDto })
  user: UserDto;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    nullable: true,
  })
  session_id?: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    nullable: true,
  })
  session_expires_at?: Date;
}

export class RefreshTokenResponseDto extends TokensDto {
  @ApiProperty({
    example: '200',
    nullable: true,
  })
  status_code?: number;

  @ApiProperty({
    example: 'Token refresh successful',
    nullable: true,
  })
  message?: string;
}
export class LogoutResponseDto {
  @ApiProperty({
    example: '200',
    nullable: true,
  })
  status_code?: number;

  @ApiProperty({
    example: 'logout success',
    nullable: true,
  })
  message?: string;
}
