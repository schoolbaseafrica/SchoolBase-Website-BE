import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RevokeSessionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  session_id!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  user_id!: string;
}

export class RevokeAllSessionsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  user_id!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  exclude_current?: string;
}
