import { Injectable, HttpStatus, BadRequestException } from '@nestjs/common';
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

  async uploadCsvToS3(
    file: Express.Multer.File,
  ): Promise<PendingInvitesResponseDto> {
    if (file.mimetype !== 'text/csv') {
      throw new BadRequestException(sysMsg.BULK_UPLOAD_NOT_ALLOWED);
    }

    if (!file) {
      throw new BadRequestException(sysMsg.NO_BULK_UPLOAD_DATA);
    }

    if (!file.originalname.endsWith('.csv')) {
      throw new BadRequestException(sysMsg.INVALID_BULK_UPLOAD_FILE);
    }
    // Parse CSV into rows
    const rows = await parseCsv<InviteUserDto>(file.buffer);

    // Filter out rows with missing or empty email
    const filteredRows = rows.filter((row) => row.email?.trim());

    // Normalize emails
    const emails = filteredRows.map((row) => row.email.trim().toLowerCase());

    // Find existing invites in DB
    const existing = await this.inviteRepo.find({
      where: emails.map((email) => ({ email })),
    });

    const existingEmails = new Set(
      existing.map((invite) => invite.email.toLowerCase()),
    );

    // Keep only rows with unique emails
    const validRows = filteredRows.filter(
      (row) => !existingEmails.has(row.email.trim().toLowerCase()),
    );

    if (validRows.length === 0) {
      throw new BadRequestException(sysMsg.BULK_UPLOAD_NO_NEW_EMAILS);
    }

    const skippedRows = filteredRows.filter((row) =>
      existingEmails.has(row.email.trim().toLowerCase()),
    );

    const createdInvites: CreatedInviteDto[] = [];

    for (const row of validRows) {
      const invite = this.inviteRepo.create({
        email: row.email.trim().toLowerCase(),
        role: row.role?.trim(),
        full_name: row.full_name?.trim(),
      });

      await this.inviteRepo.save(invite);

      createdInvites.push({
        id: invite.id,
        email: invite.email,
        invited_at: invite.invitedAt,
        role: invite.role as InviteRole,
        full_name: invite.full_name,
      });
    }

    return {
      status_code: HttpStatus.OK,
      message: sysMsg.BULK_UPLOAD_SUCCESS,
      total_bulk_invites_sent: createdInvites.length,
      data: createdInvites,
      skipped_already_exist_emil_on_csv: skippedRows.map((row) => row.email),
    };
  }
}
