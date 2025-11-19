import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { IBaseResponse } from '../../common/types/base-response.interface';
import * as sysMsg from '../../constants/system.messages';

import {
  RevokeSessionDto,
  RevokeAllSessionsDto,
} from './dto/session-revoke.dto';
import {
  IRevokeSessionData,
  IRevokeAllSessionsData,
} from './interface/session-response.interface';
import { SessionService } from './session.service';

@ApiTags('Authentication')
@Controller('auth/sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a specific session for a user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session successfully revoked',
    schema: {
      example: {
        status_code: 200,
        message: 'Session revoked successfully',
        data: { session_id: '...', user_id: '...', revoked: true },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found',
    schema: {
      example: {
        status_code: 404,
        message: 'Session not found',
        data: { session_id: '...', user_id: '...', revoked: false },
      },
    },
  })
  async revokeSession(
    @Body() revokeSessionDto: RevokeSessionDto,
  ): Promise<IBaseResponse<IRevokeSessionData>> {
    const result = await this.sessionService.revokeSession(
      revokeSessionDto.session_id,
      revokeSessionDto.user_id,
    );
    if (!result.revoked) {
      throw new NotFoundException(sysMsg.SESSION_NOT_FOUND);
    }
    return {
      status_code: HttpStatus.OK,
      message: sysMsg.SESSION_REVOKED,
      data: result,
    };
  }

  @Post('revoke-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke all sessions for a user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All sessions successfully revoked',
    schema: {
      example: {
        status_code: 200,
        message: 'All sessions revoked successfully',
        data: { user_id: '...', revoked_count: 3 },
      },
    },
  })
  async revokeAllSessions(
    @Body() revokeAllSessionsDto: RevokeAllSessionsDto,
  ): Promise<IBaseResponse<IRevokeAllSessionsData>> {
    const result = await this.sessionService.revokeAllUserSessions(
      revokeAllSessionsDto.user_id,
      revokeAllSessionsDto.exclude_current,
    );
    return {
      status_code: HttpStatus.OK,
      message: sysMsg.SESSIONS_REVOKED,
      data: result,
    };
  }
}
