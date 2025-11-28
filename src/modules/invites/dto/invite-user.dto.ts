import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';

import { PendingInviteDto } from './pending-invite.dto';

export enum InviteRole {
  TEACHER = 'TEACHER',
  PARENT = 'PARENT',
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
}

export class InviteUserDto {
  @ApiProperty({ example: 'parent@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    enum: InviteRole,
    example: InviteRole.TEACHER,
  })
  @IsEnum(InviteRole)
  role: InviteRole;

  @ApiPropertyOptional({ example: 'Olivia Doe' })
  @IsOptional()
  full_name?: string;
}

export class CreatedInviteDto extends PendingInviteDto {
  @ApiProperty({ enum: InviteRole, example: InviteRole.TEACHER })
  readonly role: InviteRole;

  @ApiPropertyOptional({ example: 'Olivia Doe' })
  readonly full_name?: string;
}

export class CreatedInvitesResponseDto {
  @ApiProperty({ example: 200 })
  status_code: number;

  @ApiProperty({ example: 'Invite sent successfully' })
  message: string;

  @ApiProperty({ type: [CreatedInviteDto] })
  data: CreatedInviteDto[];
}

export class BulkInvitesResponseDto {
  @ApiProperty({ example: 200 })
  status_code: number;

  @ApiProperty({ example: 'Invite sent successfully' })
  message: string;

  @ApiProperty({ example: 2 })
  total_bulk_invites_sent: number;

  @ApiProperty({ type: [InviteUserDto] }) // ✅ use InviteUserDto here
  data: InviteUserDto[];

  @ApiProperty({ type: [String] })
  skipped_already_exist_emil_on_csv: string[];

  @ApiProperty({ enum: InviteRole })
  document_type: InviteRole;
}
