import {
  ConflictException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';
import { Logger } from 'winston';

import { EmailTemplateID } from 'src/constants/email-constants';

import config from '../../config/config';
import * as sysMsg from '../../constants/system.messages';
import { EmailService } from '../email/email.service';

import { CreateSuperadminDto } from './dto/create-superadmin.dto';
import { LoginSuperadminDto } from './dto/login-superadmin.dto';
import { LogoutDto } from './dto/superadmin-logout.dto';
import { Role } from './entities/superadmin.entity';
import { SuperadminModelAction } from './model-actions/superadmin-actions';
import { SuperadminSessionService } from './session/superadmin-session.service';

@Injectable()
export class SuperadminService {
  private readonly logger: Logger;
  constructor(
    private readonly superadminModelAction: SuperadminModelAction,
    @Inject(WINSTON_MODULE_PROVIDER) logger: Logger,
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly superadminSessionService: SuperadminSessionService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    this.logger = logger.child({ context: SuperadminService.name });
  }

  private async generateTokens(userId: string, email: string) {
    const { jwt } = config();
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwt.secret,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: jwt.refreshSecret,
        expiresIn: '7d',
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  private async sendWelcomeEmail(userName: string, email: string) {
    await this.emailService.sendMail({
      to: [{ email: email, name: userName }],
      subject: 'Welcome to Open School Portal',
      templateNameID: EmailTemplateID.SUPERADMIN_WELCOME,
      templateData: {
        first_name: userName,
        school_name: 'Open School Portal',
        logo_url: 'https://staging.schoolbase.africa/assets/logo.svg',
        role: Role.SUPERADMIN,
        invite_link: `
          ${this.configService.get<string>('frontend.superadmin_login_url')}
          `,
      },
    });
  }

  async createSuperAdmin(createSuperadminDto: CreateSuperadminDto) {
    const { password, confirm_password, email, ...restData } =
      createSuperadminDto;

    if (!password || !confirm_password) {
      throw new ConflictException(sysMsg.SUPERADMIN_PASSWORDS_REQUIRED);
    }

    const existing = await this.superadminModelAction.get({
      identifierOptions: { role: Role.SUPERADMIN },
    });

    const passwordHash: string = await bcrypt.hash(password, 10);

    const createNewRecord = async (manager) => {
      const updatedSuperadminRecord = await this.superadminModelAction.create({
        createPayload: {
          ...restData,
          email,
          password: passwordHash,
          role: Role.SUPERADMIN,
          is_active: createSuperadminDto.school_name ? true : false,
        },
        transactionOptions: { useTransaction: true, transaction: manager },
      });
      return updatedSuperadminRecord;
    };

    const updateRecord = async (manager) => {
      const updatedSuperadminRecord = await this.superadminModelAction.update({
        updatePayload: {
          ...restData,
          email,
          password: passwordHash,
          role: Role.SUPERADMIN,
          is_active: createSuperadminDto.school_name ? true : false,
        },
        identifierOptions: { role: Role.SUPERADMIN },
        transactionOptions: { useTransaction: true, transaction: manager },
      });
      return updatedSuperadminRecord;
    };

    if (existing) {
      const updatedSuperadmin = await this.dataSource.transaction(updateRecord);

      if (updatedSuperadmin.password) delete updatedSuperadmin.password;

      this.logger.info(sysMsg.SUPERADMIN_ACCOUNT_UPDATED);

      return {
        message: sysMsg.SUPERADMIN_ACCOUNT_UPDATED,
        status_code: HttpStatus.OK,
        data: updatedSuperadmin,
      };
    }

    const createdSuperadmin =
      await this.dataSource.transaction(createNewRecord);

    if (createdSuperadmin.password) delete createdSuperadmin.password;

    await this.sendWelcomeEmail(
      createdSuperadmin.first_name,
      createdSuperadmin.email,
    );

    this.logger.info(sysMsg.SUPERADMIN_ACCOUNT_CREATED);

    return {
      message: sysMsg.SUPERADMIN_ACCOUNT_CREATED,
      status_code: HttpStatus.CREATED,
      data: createdSuperadmin,
    };
  }

  /**
   * Logs in user
   * @param loginSuperadminDto - requires data with which a superadmin is logged on
   */
  async login(loginSuperadminDto: LoginSuperadminDto) {
    // Find superadmin by email
    const superadmin = await this.superadminModelAction.get({
      identifierOptions: { email: loginSuperadminDto.email },
    });
    if (!superadmin) {
      throw new UnauthorizedException(sysMsg.INVALID_CREDENTIALS);
    }

    // Check if active (assuming isActive field)
    if (!superadmin.is_active) {
      throw new UnauthorizedException(sysMsg.USER_INACTIVE);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginSuperadminDto.password,
      superadmin.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(sysMsg.INVALID_CREDENTIALS);
    }

    const tokens = await this.generateTokens(superadmin.id, superadmin.email);

    let sessionInfo = null;
    if (this.superadminSessionService && tokens.refresh_token) {
      sessionInfo = await this.superadminSessionService.createSession(
        superadmin.id,
        tokens.refresh_token,
      );
    }

    this.logger.info(sysMsg.LOGIN_SUCCESS);

    return {
      message: sysMsg.LOGIN_SUCCESS,
      data: {
        id: superadmin.id,
        email: superadmin.email,
        first_name: superadmin.first_name,
        last_name: superadmin.last_name,
        school_name: superadmin.school_name,
        ...tokens,
        session_id: sessionInfo?.session_id,
        session_expires_at: sessionInfo?.expires_at,
      },
      status_code: HttpStatus.OK,
    };
  }

  /**
   * logs out a logged on superadmin
   */
  async logout(logoutDto: LogoutDto) {
    if (this.superadminSessionService) {
      // follow the same parameter order used in AuthService tests (superadmin_id, session_id)
      await this.superadminSessionService.revokeSession(
        logoutDto.session_id,
        logoutDto.user_id,
      );
    }

    this.logger.info(sysMsg.LOGOUT_SUCCESS);

    return {
      status_code: HttpStatus.OK,
      message: sysMsg.LOGOUT_SUCCESS,
    };
  }
}
