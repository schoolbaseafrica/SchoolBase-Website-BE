import * as crypto from 'crypto';

import {
  Inject,
  Injectable,
  HttpStatus,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { FindOptionsWhere } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../constants/system.messages';
import { UserRole } from '../user/entities/user.entity';
import { UserModelAction } from '../user/model-actions/user-actions';

import { AcceptInviteDto } from './dto/accept-invite.dto';
import { Invite, InviteStatus } from './entities/invites.entity';
import { InviteModelAction } from './invite.model-action';

@Injectable()
export class InviteService {
  private readonly logger: Logger;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) baseLogger: Logger,

    private readonly userModelAction: UserModelAction,
    private readonly inviteModelAction: InviteModelAction,
  ) {
    this.logger = baseLogger.child({ context: InviteService.name });
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
