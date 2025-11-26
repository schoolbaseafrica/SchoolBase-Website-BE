import { ApiProperty } from '@nestjs/swagger';

export class PendingInviteDto {
  @ApiProperty({ example: 'uuid-1' })
  readonly id: string;

  @ApiProperty({ example: 'teacher@example.com' })
  readonly email: string;

  @ApiProperty({ example: '2025-11-18T18:53:00.000Z' })
  readonly invited_at: Date;
}

export class PendingInvitesResponseDto {
  @ApiProperty({ example: 200 })
  status_code: number;

  @ApiProperty({ example: 'Pending invites retrieved successfully' })
  message: string;

  @ApiProperty({ type: [PendingInviteDto] })
  data: PendingInviteDto[];
  skipped_already_exist_emil_on_csv?: string[];
  total_bulk_invites_sent?: number;
}
