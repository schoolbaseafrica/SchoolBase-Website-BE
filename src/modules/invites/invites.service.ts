import * as crypto from 'crypto';

import {
  Inject,
  Injectable,
  HttpStatus,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource, FindOptionsWhere, In, Repository } from 'typeorm';
import { Logger } from 'winston';

import { EmailTemplateID } from '../../constants/email-constants';
import * as sysMsg from '../../constants/system.messages';
import { EmailService } from '../email/email.service';
import { EmailPayload } from '../email/email.types';
import { parseCsv } from '../invites/csv-parser';
import { UserRole } from '../user/entities/user.entity';
import { UserModelAction } from '../user/model-actions/user-actions';

import { AcceptInviteDto } from './dto/accept-invite.dto';
import { InviteQueryDto } from './dto/get-invites.dto';
import {
  InviteUserDto,
  InviteRole,
  BulkInvitesResponseDto,
} from './dto/invite-user.dto';
import { Invite, InviteStatus } from './entities/invites.entity';
import { InviteModelAction } from './invite.model-action';

@Injectable()
export class InviteService {
  private readonly logger: Logger;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) baseLogger: Logger,
    private readonly configService: ConfigService,
    private readonly userModelAction: UserModelAction,
    private readonly inviteModelAction: InviteModelAction,
    private readonly emailService: EmailService,
    private readonly dataSource: DataSource,
    // Keep repository for complex queries and employment ID generation
    @InjectRepository(Invite)
    private readonly inviteRepository: Repository<Invite>,
  ) {
    this.logger = baseLogger.child({ context: InviteService.name });
  }

  async inviteUser(inviteUserDto: InviteUserDto) {
    return this.dataSource.transaction(async (manager) => {
      // Check if user already exists
      const existingUser = await this.userModelAction.get({
        identifierOptions: {
          email: inviteUserDto.email,
        } as FindOptionsWhere<unknown>,
      });

      if (existingUser) {
        throw new ConflictException(sysMsg.ACCOUNT_ALREADY_EXISTS);
      }

      // Check if there's a pending invite
      const existingInvite = await this.inviteModelAction.get({
        identifierOptions: {
          email: inviteUserDto.email,
          status: InviteStatus.PENDING,
        } as FindOptionsWhere<Invite>,
      });

      if (existingInvite && new Date() < existingInvite.expires_at) {
        throw new ConflictException(sysMsg.ACTIVE_INVITE_EXISTS);
      }

      // Generate token
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Create invite
      const expiresAt = new Date();
      const tokenExpirationDays = parseInt(
        this.configService.get<string>('invite.expiry'),
      );
      expiresAt.setDate(expiresAt.getDate() + tokenExpirationDays);

      const savedInvite = await this.inviteModelAction.create({
        createPayload: {
          email: inviteUserDto.email,
          role: inviteUserDto.role,
          full_name: inviteUserDto.full_name,
          token_hash: tokenHash,
          expires_at: expiresAt,
          status: InviteStatus.PENDING,
          accepted: false,
        },
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });

      // Send invitation email
      await this.sendInvitationEmail(inviteUserDto, token);

      this.logger.info('User invitation created and email sent', {
        invite_id: savedInvite.id,
        email: inviteUserDto.email,
        role: inviteUserDto.role,
      });

      return {
        id: savedInvite.id,
        email: savedInvite.email,
        invited_at: savedInvite.invited_at,
        role: savedInvite.role,
        full_name: savedInvite.full_name,
      };
    });
  }

  private async sendInvitationEmail(inviteDto: InviteUserDto, token: string) {
    const frontend_url = this.configService.get<string>('frontend.url');
    const school_name =
      this.configService.get<string>('app.name') || 'School Base';
    const logo_url =
      this.configService.get<string>('app.logo_url') ||
      'https://via.placeholder.com/100';

    const invite_link = `${frontend_url}/reset-password?token=${token}`;
    const first_name = inviteDto.full_name?.split(' ')[0] || 'User';

    const emailPayload: EmailPayload = {
      to: [{ email: inviteDto.email, name: inviteDto.full_name }],
      subject: `You're invited to join ${school_name}`,
      templateNameID: EmailTemplateID.INVITE,
      templateData: {
        first_name,
        school_name,
        logo_url,
        role: inviteDto.role,
        invite_link,
      },
    };

    await this.emailService.sendMail(emailPayload);
    this.logger.info('Invitation email sent', {
      email: inviteDto.email,
    });
  }

  async acceptInvite(acceptInviteDto: AcceptInviteDto) {
    const { token, password } = acceptInviteDto;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const invite = await this.inviteModelAction.get({
      identifierOptions: {
        token_hash: hashedToken,
        status: InviteStatus.PENDING,
      } as FindOptionsWhere<Invite>,
    });

    if (!invite) {
      throw new NotFoundException(sysMsg.INVALID_VERIFICATION_TOKEN);
    }

    if (invite.accepted) {
      throw new ConflictException('This invitation has already been used.');
    }

    if (new Date() > invite.expires_at) {
      throw new BadRequestException(sysMsg.TOKEN_EXPIRED);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const names = invite.full_name ? invite.full_name.split(' ') : ['User', ''];
    const firstName = names[0];
    const lastName = names.slice(1).join(' ') || '';

    const newUser = await this.userModelAction.create({
      createPayload: {
        email: invite.email,
        password: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        role: [invite.role as UserRole],
        is_active: true,
        is_verified: true,
      },
      transactionOptions: { useTransaction: false },
    });

    await this.inviteModelAction.update({
      identifierOptions: { id: invite.id },
      updatePayload: { accepted: true },
      transactionOptions: { useTransaction: false },
    });

    this.logger.info(
      `User ${newUser.email} successfully created via invitation.`,
    );

    return {
      status_code: HttpStatus.CREATED,
      message: sysMsg.ACCOUNT_CREATED,
      data: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
    };
  }

  async findAll(query: InviteQueryDto) {
    const {
      page = 1,
      limit = 20,
      status,
      role,
      email,
      invited_from,
      invited_to,
      expires_after,
      expires_before,
      sort_by = 'invited_at',
      order = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const qb = this.inviteRepository.createQueryBuilder('invite');

    // --- Status filter ---
    if (status) {
      qb.andWhere('invite.status = :status', { status });
    }

    // --- Role filter ---
    if (role) {
      qb.andWhere('invite.role = :role', { role });
    }

    // --- Email filter ---
    if (email) {
      qb.andWhere('invite.email = :email', { email });
    }

    // --- Date filters: invited_at ---
    if (invited_from) {
      qb.andWhere('invite.invited_at >= :from', {
        from: new Date(invited_from).toISOString(),
      });
    }

    if (invited_to) {
      qb.andWhere('invite.invited_at <= :to', {
        to: new Date(invited_to).toISOString(),
      });
    }

    // --- Date filters: expires_at ---
    if (expires_after) {
      qb.andWhere(
        'invite.expires_at IS NOT NULL AND invite.expires_at >= :expAfter',
        {
          expAfter: new Date(expires_after).toISOString(),
        },
      );
    }

    if (expires_before) {
      qb.andWhere(
        'invite.expires_at IS NOT NULL AND invite.expires_at <= :expBefore',
        {
          expBefore: new Date(expires_before).toISOString(),
        },
      );
    }

    // --- Sorting ---
    const orderDirection = order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const allowedSortFields = {
      invited_at: 'invite.invited_at',
      expires_at: 'invite.expires_at',
      email: 'invite.email',
      status: 'invite.status',
    };

    const sortField = allowedSortFields[sort_by] || 'invite.invited_at';

    qb.orderBy(sortField, orderDirection);

    // --- Total count before pagination ---
    const total = await qb.getCount();

    // --- Pagination ---
    qb.skip(skip).take(limit);

    const invites = await qb.getMany();

    // --- Transform to DTO ---
    const data = invites.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      status: inv.status,
      full_name: inv.full_name,
      accepted: inv.accepted,
      invited_at: inv.invited_at,
      expires_at: inv.expires_at,
      school_id: inv.school_id,
    }));

    return {
      data,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  async uploadCsv(
    file: Express.Multer.File,
    selectedType: InviteRole,
  ): Promise<BulkInvitesResponseDto> {
    if (!file) {
      throw new BadRequestException(sysMsg.NO_BULK_UPLOAD_DATA);
    }

    if (file.mimetype !== 'text/csv') {
      throw new BadRequestException(sysMsg.BULK_UPLOAD_NOT_ALLOWED);
    }

    if (!file.originalname.endsWith('.csv')) {
      throw new BadRequestException(sysMsg.INVALID_BULK_UPLOAD_FILE);
    }

    // ✅ Changed: parseCsv now expects full_name before email
    const rows = await parseCsv<{ email: string; full_name: string }>(
      file.buffer,
    );

    const filteredRows = rows.filter((row) => row.email?.trim());
    const emails = filteredRows.map((row) => row.email.trim().toLowerCase());

    const existing = await this.inviteModelAction.get({
      identifierOptions: { email: In(emails) } as FindOptionsWhere<Invite>,
    });

    const existingEmails = new Set(
      Array.isArray(existing)
        ? existing.map((invite) => invite.email.toLowerCase())
        : [existing?.email?.toLowerCase()],
    );

    const validRows = filteredRows.filter(
      (row) => !existingEmails.has(row.email.trim().toLowerCase()),
    );

    if (validRows.length === 0) {
      throw new BadRequestException(sysMsg.BULK_UPLOAD_NO_NEW_EMAILS);
    }

    const skippedRows = filteredRows.filter((row) =>
      existingEmails.has(row.email.trim().toLowerCase()),
    );

    const createdInvites: InviteUserDto[] = [];

    const frontendUrl = this.configService.get<string>('frontend.url');
    const schoolName =
      this.configService.get<string>('school.name') || 'School Base';
    const schoolLogoUrl =
      this.configService.get<string>('school.logoUrl') ||
      'https://via.placeholder.com/100';
    const senderEmail = this.configService.get<string>('mail.from.address');
    const senderName = this.configService.get<string>('mail.from.name');

    if (!frontendUrl || !schoolName || !schoolLogoUrl) {
      throw new InternalServerErrorException(
        'Missing SCHOOL_NAME, SCHOOL_LOGO_URL or FRONTEND_URL in config',
      );
    }

    // ✅ Changed: wrap invite creation + email sending in a transaction
    await this.dataSource.transaction(async (manager) => {
      for (const row of validRows) {
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto
          .createHash('sha256')
          .update(rawToken)
          .digest('hex');

        const invite = await this.inviteModelAction.create({
          createPayload: {
            email: row.email.trim().toLowerCase(),
            full_name: row.full_name?.trim(),
            role: selectedType,
            token_hash: hashedToken,
            status: InviteStatus.PENDING,
            accepted: false,
          },
          transactionOptions: { useTransaction: true, transaction: manager }, // ✅ Changed: use transaction manager
        });

        await this.inviteModelAction.save({
          entity: invite,
          transactionOptions: { useTransaction: true, transaction: manager }, // ✅ Changed: use transaction manager
        });

        const inviteLink = `${frontendUrl}/reset-password?token=${rawToken}`;
        const firstName = invite.full_name?.trim()?.split(' ')?.[0] || 'User';

        // ✅ Changed: email sending is inside transaction — if this fails, DB rolls back
        await this.emailService.sendMail({
          from: { email: senderEmail, name: senderName },
          to: [{ email: invite.email, name: invite.full_name }],
          subject: `You are invited as ${selectedType}`,
          templateNameID: EmailTemplateID.INVITE,
          templateData: {
            first_name: firstName,
            invite_link: inviteLink,
            role: invite.role,
            school_name: schoolName,
            logo_url: schoolLogoUrl,
            copyRightYear: new Date().getFullYear(),
          },
        });

        createdInvites.push({
          email: invite.email,
          role: selectedType,
          full_name: invite.full_name,
        });
      }
    });

    return {
      status_code: HttpStatus.OK,
      message: sysMsg.BULK_UPLOAD_SUCCESS,
      total_bulk_invites_sent: createdInvites.length,
      data: createdInvites,
      skipped_already_exist_emil_on_csv: skippedRows.map((r) => r.email),
      document_type: selectedType,
    };
  }
}
