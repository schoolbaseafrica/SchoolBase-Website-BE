import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { SessionsService } from './sessions.service';

@ApiTags('Sessions')
@ApiBearerAuth()
@Controller('auth/sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all active sessions for the logged-in user' })
  @ApiResponse({
    status: 200,
    description: 'List of active sessions',
    schema: {
      example: [
        {
          id: 'uuid',
          userId: 'uuid',
          isActive: true,
          expiresAt: '2025-11-20T00:00:00.000Z',
          createdAt: '2025-11-19T00:00:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getActiveSessions(@Req() req) {
    return this.sessionsService.getActiveSessions(req.user.userId);
  }
}
