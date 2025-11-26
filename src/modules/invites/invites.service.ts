import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as sysMsg from '../../constants/system.messages';

import {
  InviteUserDto,
  CreatedInviteDto,
  InviteRole,
} from './dto/invite-user.dto';
import {
  PendingInviteDto,
  PendingInvitesResponseDto,
} from './dto/pending-invite.dto';
import { Invite } from './entities/invites.entity';

@Injectable()
export class InviteService {
  constructor(
    @InjectRepository(Invite)
    private readonly inviteRepo: Repository<Invite>,
  ) {}

  async sendInvite(payload: InviteUserDto): Promise<PendingInvitesResponseDto> {
    const exists = await this.inviteRepo.findOne({
      where: { email: payload.email },
    });

    if (exists) {
      return {
        status_code: HttpStatus.CONFLICT,
        message: sysMsg.INVITE_ALREADY_SENT,
        data: [],
      };
    }

    const invite = this.inviteRepo.create({
      email: payload.email,
      role: payload.role,
      full_name: payload.full_name,
    });

    await this.inviteRepo.save(invite);

    const createdInvite: CreatedInviteDto = {
      id: invite.id,
      email: invite.email,
      invited_at: invite.invitedAt,
      role: invite.role as InviteRole,
      full_name: invite.full_name,
    };

    /**const emailPayload: EmailPayload = {
      to: [
        { 
          email: invite.email, 
          name: invite.full_name 
        }
      ],
      subject: `You are invited to ${schoolName}`,
      templateNameID: EmailTemplateID.INVITE, // 'invite.njk'
      templateData: {
        firstName: invite.full_name.split(' ')[0], 
        role: invite.role,                         
        schoolName: schoolName,                    
        logoUrl: schoolLogo,                       
        inviteLink: inviteLink,                    
      },
    };


    let route = 'accept-invite';

    switch (payload.role) {
      case UserRole.TEACHER:
        route = 'invited-teacher';
        break;
      case UserRole.PARENT:
        route = 'invited-parent';
        break;
      case UserRole.ADMIN:
        route = 'invited-admin';
        break;
      case UserRole.STUDENT:
        route = 'invited-student';
        break;
      default:
        route = 'accept-invite';
    }

    // Use the dynamic route in the link
    const inviteLink = `${frontendUrl}/${route}?token=${token}`;
    
    **/

    {
      return {
        status_code: HttpStatus.OK,
        message: sysMsg.INVITE_SENT,
        data: [createdInvite],
      };
    }
  }

  async getPendingInvites(): Promise<PendingInvitesResponseDto> {
    const invites = await this.inviteRepo.find({
      where: { accepted: false },
      order: { createdAt: 'DESC' },
    });

    if (invites.length === 0) {
      return {
        status_code: HttpStatus.NOT_FOUND,
        message: sysMsg.NO_PENDING_INVITES,
        data: [],
      };
    }

    const mappedInvites: PendingInviteDto[] = invites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      invited_at: invite.invitedAt,
    }));

    return {
      status_code: HttpStatus.OK,
      message: sysMsg.PENDING_INVITES_FETCHED,
      data: mappedInvites,
    };
  }
}
