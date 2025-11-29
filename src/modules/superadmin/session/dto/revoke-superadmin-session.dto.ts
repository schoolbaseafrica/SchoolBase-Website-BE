import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class RevokeSuperadminSessionDto {
  @ApiProperty({
    example: 'session-id-123',
    description: 'session id',
  })
  @IsUUID()
  @IsNotEmpty()
  session_id!: string;

  @ApiProperty({
    example: 'superadmin-id-123',
    description: 'superadmin id',
  })
  @IsUUID()
  @IsNotEmpty()
  superadmin_id!: string;
}

export class RevokeAllSuperadminSessionsDto {
  @ApiProperty({
    example: 'superadmin-id-123',
    description: 'superadmin id',
  })
  @IsUUID()
  @IsNotEmpty()
  superadmin_id!: string;

  @ApiPropertyOptional({
    example: 'session-id-123',
    description: 'session id to exclude from revocation',
  })
  @IsString()
  @IsOptional()
  exclude_current?: string;
}
