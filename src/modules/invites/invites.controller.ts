import {
  Controller,
  Get,
  Post,
  Body,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import * as sysMsg from '../../constants/system.messages';

import { AcceptInviteDto } from './dto/accept-invite.dto';
import {
  InviteUserDto,
  CreatedInvitesResponseDto,
} from './dto/invite-user.dto';
import { PendingInvitesResponseDto } from './dto/pending-invite.dto';
import { InviteService } from './invites.service';

@ApiTags('Invites')
@Controller('auth/invites')
export class InvitesController {
  constructor(private readonly inviteService: InviteService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invite new teachers or parents' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Invitation sent successfully',
    type: CreatedInvitesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: `Invitation already sent`,
    type: CreatedInvitesResponseDto,
  })
  async inviteUser(@Body() payload: InviteUserDto) {
    return this.inviteService.sendInvite(payload);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieve all pending invites' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns pending invites',
    type: PendingInvitesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No pending invites found',
    type: PendingInvitesResponseDto,
  })
  async getPendingInvites(): Promise<PendingInvitesResponseDto> {
    return this.inviteService.getPendingInvites();
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
