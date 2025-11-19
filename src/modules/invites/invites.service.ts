import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  PENDING_INVITES_FETCHED,
  INVITE_SENT,
  NO_PENDING_INVITES,
  INVITE_ALREADY_SENT,
} from '../../constants/system.messages';

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
        message: INVITE_ALREADY_SENT,
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

    {
      return {
        status_code: HttpStatus.OK,
        message: INVITE_SENT,
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
        message: NO_PENDING_INVITES,
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
      message: PENDING_INVITES_FETCHED,
      data: mappedInvites,
    };
  }
}
