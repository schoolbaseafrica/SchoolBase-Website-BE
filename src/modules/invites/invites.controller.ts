import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import * as sysMsg from '../../constants/system.messages';

import { AcceptInviteDto } from './dto/accept-invite.dto';
import { InviteService } from './invites.service';

@ApiTags('Invites')
@Controller('auth/invites')
export class InvitesController {
  constructor(private readonly inviteService: InviteService) {}

  @Post('accept')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Accept invitation and set password' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: sysMsg.ACCOUNT_CREATED,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: sysMsg.INVALID_VERIFICATION_TOKEN,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: sysMsg.TOKEN_EXPIRED,
  })
  async acceptInvite(@Body() acceptInviteDto: AcceptInviteDto) {
    const user = await this.inviteService.acceptInvite(acceptInviteDto);
    return {
      status_code: HttpStatus.OK,
      message: 'Account activated successfully',
      data: user,
    };
  }
}
