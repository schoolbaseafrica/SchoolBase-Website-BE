import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
  IsInt,
  Min,
  IsIn,
} from 'class-validator';

import { InviteStatus } from '../entities/invites.entity';

export class InviteQueryDto {
  @ApiPropertyOptional({
    enum: InviteStatus,
    description: 'Filter by invite status',
  })
  @IsOptional()
  @IsEnum(InviteStatus)
  status?: InviteStatus;

  @ApiPropertyOptional({
    description: 'Filter by role (e.g., admin, teacher)',
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({
    description: 'Search invite by email',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Invited from date (ISO format)' })
  @IsOptional()
  @IsDateString()
  invited_from?: string;

  @ApiPropertyOptional({ description: 'Invited to date (ISO format)' })
  @IsOptional()
  @IsDateString()
  invited_to?: string;

  @ApiPropertyOptional({
    description: 'Filter invites expiring after (ISO date)',
  })
  @IsOptional()
  @IsDateString()
  expires_after?: string;

  @ApiPropertyOptional({
    description: 'Filter invites expiring before (ISO date)',
  })
  @IsOptional()
  @IsDateString()
  expires_before?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['invited_at', 'expires_at', 'email', 'status'],
  })
  @IsOptional()
  @IsIn(['invited_at', 'expires_at', 'email', 'status'])
  sort_by?: string = 'invited_at';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';
}
