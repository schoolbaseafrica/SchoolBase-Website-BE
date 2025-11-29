import { ApiProperty } from '@nestjs/swagger';

import * as sysMsg from '../../../constants/system.messages';
import { Role } from '../entities/superadmin.entity';

export class SuperadminLoginResponseDto {
  @ApiProperty({
    example: '200',
    nullable: false,
  })
  status_code: number;

  @ApiProperty({
    example: sysMsg.SUPERADMIN_ACCOUNT_CREATED,
    nullable: false,
  })
  message?: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: {
      id: 'uuid-1234',
      email: 'admin@example.com',
      first_name: 'John',
      last_name: 'Doe',
      school_name: 'Example School',
      role: Role.SUPERADMIN,
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      session_id: 'session-uuid-1234',
      session_expires_at: '2025-12-01T00:00:00.000Z',
    },
  })
  data: Record<string, unknown>;
}
