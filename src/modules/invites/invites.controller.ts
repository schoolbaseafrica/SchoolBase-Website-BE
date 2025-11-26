import {
  Controller,
  Get,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import * as sysMsg from '../../constants/system.messages';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../shared/enums';

import { csvUploadDocs } from './docs/csv-swagger-doc';
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

  @Post('csv-bulk-upload')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @csvUploadDocs()
  async uploadCsv(@UploadedFile() file: Express.Multer.File) {
    const key = await this.inviteService.uploadCsvToS3(file);
    return {
      status_code: HttpStatus.OK,
      message: sysMsg.OPERATION_SUCCESSFUL,
      file_key: key,
    };
  }
}
