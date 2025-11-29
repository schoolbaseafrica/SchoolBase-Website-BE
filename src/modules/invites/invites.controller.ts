import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

import * as sysMsg from '../../constants/system.messages';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../shared/enums';

import { csvUploadDocs } from './docs/csv-swagger-doc';
import { ApiInviteTags } from './docs/invite.swagger';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { InviteRole, InviteUserDto } from './dto/invite-user.dto';
import { InviteService } from './invites.service';

@ApiInviteTags()
@Controller('auth/invites')
export class InvitesController {
  constructor(private readonly inviteService: InviteService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
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

  @Post('csv-bulk-upload')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @csvUploadDocs()
  async uploadCsv(
    @UploadedFile() file: Express.Multer.File,
    @Query('type') selectedType: InviteRole,
  ) {
    const key = await this.inviteService.uploadCsv(file, selectedType);
    return {
      status_code: HttpStatus.OK,
      message: sysMsg.OPERATION_SUCCESSFUL,
      file_key: key,
    };
  }
}
