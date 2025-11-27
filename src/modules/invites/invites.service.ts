import * as crypto from 'crypto';

import {
  Inject,
  Injectable,
  HttpStatus,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource, FindOptionsWhere } from 'typeorm';
import { Logger } from 'winston';

import { EmailTemplateID } from '../../constants/email-constants';
import * as sysMsg from '../../constants/system.messages';
import { EmailService } from '../email/email.service';
import { EmailPayload } from '../email/email.types';
import { UserRole } from '../user/entities/user.entity';
import { UserModelAction } from '../user/model-actions/user-actions';

import { AcceptInviteDto } from './dto/accept-invite.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { Invite, InviteStatus } from './entities/invites.entity';
import { InviteModelAction } from './invite.model-action';

@Injectable()
export class InviteService {
  private readonly logger: Logger;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) baseLogger: Logger,
    private readonly dataSource: DataSource,

    private readonly userModelAction: UserModelAction,
    private readonly inviteModelAction: InviteModelAction,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
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

    const invite_link = `${frontend_url}/accept-invite?token=${token}`;
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
}
