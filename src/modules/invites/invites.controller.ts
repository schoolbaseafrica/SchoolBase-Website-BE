import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

import * as sysMsg from '../../constants/system.messages';

import { ApiInviteTags } from './docs/invite.swagger';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { InviteService } from './invites.service';

@ApiInviteTags()
@Controller('auth/invites')
export class InvitesController {
  constructor(private readonly inviteService: InviteService) {}

  @Post()
  async inviteUser(@Body() inviteUserDto: InviteUserDto) {
    const result = await this.inviteService.inviteUser(inviteUserDto);
    return {
      message: sysMsg.INVITE_SENT,
      data: result,
    };
  }

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
