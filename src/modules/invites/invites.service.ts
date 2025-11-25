import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { S3 } from 'aws-sdk';
import { Repository } from 'typeorm';

import config from '../../config/config';
import * as sysMsg from '../../constants/system.messages';
import { parseCsv } from '../invites/csv-parser';

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

const { aws } = config();

@Injectable()
export class InviteService {
  private readonly s3 = new S3({
    region: aws.region,
    accessKeyId: aws.accessKeyId,
    secretAccessKey: aws.secretAccessKey,
  });

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

  // async uploadCsvToS3(file: Express.Multer.File): Promise<string> {
  //   const bucket = aws.bucketName;
  //   const key = `invites/${Date.now()}-${file.originalname}`;

  //   const params = {
  //     Bucket: bucket,
  //     Key: key,
  //     Body: file.buffer,
  //     ContentType: file.mimetype,
  //   };

  //   const result = await this.s3.upload(params).promise();
  //   return result.Key;
  // }

  async uploadCsvToS3(
    file: Express.Multer.File,
  ): Promise<PendingInvitesResponseDto> {
    const rows = await parseCsv<InviteUserDto>(file.buffer);
    const emails = rows.map((row) => row.email.trim().toLowerCase());

    const existing = await this.inviteRepo.find({
      where: emails.map((email) => ({ email })),
    });
    const existingEmails = new Set(
      existing.map((invite) => invite.email.toLowerCase()),
    );

    const validRows = rows.filter(
      (row) => !existingEmails.has(row.email.trim().toLowerCase()),
    );

    const createdInvites: CreatedInviteDto[] = [];

    for (const row of validRows) {
      const invite = this.inviteRepo.create(row);
      await this.inviteRepo.save(invite);

      createdInvites.push({
        id: invite.id,
        email: invite.email,
        invited_at: invite.invitedAt,
        role: invite.role as InviteRole,
        full_name: invite.full_name,
      });

      // Optionally, send invitation email here
    }

    return {
      status_code: HttpStatus.OK,
      message: `${createdInvites.length} invites sent. ${rows.length - createdInvites.length} skipped.`,
      data: createdInvites,
    };
  }
}
