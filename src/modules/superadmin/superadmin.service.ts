import {
  ConflictException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';
import { Logger } from 'winston';

import config from '../../config/config';
import * as sysMsg from '../../constants/system.messages';
import { SessionService } from '../session/session.service';

import { CreateSuperadminDto } from './dto/create-superadmin.dto';
import { LoginSuperadminDto } from './dto/login-superadmin.dto';
import { LogoutDto } from './dto/superadmin-logout.dto';
import { SuperadminModelAction } from './model-actions/superadmin-actions';

@Injectable()
export class SuperadminService {
  private readonly logger: Logger;
  constructor(
    private readonly superadminModelAction: SuperadminModelAction,
    @Inject(WINSTON_MODULE_PROVIDER) logger: Logger,
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
  ) {
    this.logger = logger.child({ context: SuperadminService.name });
  }

  private async generateTokens(userId: string, email: string) {
    const { jwt } = config();
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwt.secret,
        expiresIn: '120m',
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

  async createSuperAdmin(createSuperadminDto: CreateSuperadminDto) {
    const { password, confirm_password, email, ...restData } =
      createSuperadminDto;

    if (!password || !confirm_password) {
      throw new ConflictException(sysMsg.SUPERADMIN_PASSWORDS_REQUIRED);
    }

    const existing = await this.superadminModelAction.get({
      identifierOptions: { email: createSuperadminDto.email },
    });

    if (existing) {
      throw new ConflictException(sysMsg.SUPERADMIN_EMAIL_EXISTS);
    }

    const passwordHash: string = await bcrypt.hash(password, 10);

    const createdSuperadmin = await this.dataSource.transaction(
      async (manager) => {
        const newSuperadmin = await this.superadminModelAction.create({
          createPayload: {
            ...restData,
            email,
            password: passwordHash,
            isActive: createSuperadminDto.schoolName ? true : false,
          },
          transactionOptions: { useTransaction: true, transaction: manager },
        });
        return newSuperadmin;
      },
    );

    if (createdSuperadmin.password) delete createdSuperadmin.password;

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
      throw new ConflictException(sysMsg.INVALID_CREDENTIALS);
    }

    // Check if active (assuming isActive field)
    if (!superadmin.isActive) {
      throw new ConflictException(sysMsg.USER_INACTIVE);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginSuperadminDto.password,
      superadmin.password,
    );

    if (!isPasswordValid) {
      throw new ConflictException(sysMsg.INVALID_CREDENTIALS);
    }

    // TODO: Generate JWT or session if needed
    // Return basic info for now
    const tokens = await this.generateTokens(superadmin.id, superadmin.email);

    let sessionInfo = null;
    if (this.sessionService && tokens.refresh_token) {
      sessionInfo = await this.sessionService.createSession(
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
        firstName: superadmin.firstName,
        lastName: superadmin.lastName,
        schoolName: superadmin.schoolName,
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
    if (this.sessionService) {
      // follow the same parameter order used in AuthService tests (user_id, session_id)
      await this.sessionService.revokeSession(
        logoutDto.user_id,
        logoutDto.session_id,
      );
    }

    this.logger.info(sysMsg.LOGOUT_SUCCESS);

    return { message: sysMsg.LOGOUT_SUCCESS };
  }

  /**
   * sends a reset password email to the provided email, having
   * confirmed that the email exists
   *
   * @param forgotSuperadminPasswordDto - contains the email to which the
   * password reset email is sent
   */
  // async forgotPassword(
  //   forgotSuperadminPasswordDto: ForgotSuperadminPasswordDto,
  // ) {
  //   const { email } = forgotSuperadminPasswordDto;
  //   const superadmin = await this.superadminModelAction.get({
  //     identifierOptions: { email },
  //   });

  //   if (!superadmin) {
  //     // For security, do not reveal if email exists
  //     return { message: sysMsg.PASSWORD_RESET_SENT };
  //   }

  //   // Generate reset token and expiry
  //   // const crypto = await import('crypto');
  //   const resetToken = crypto.randomBytes(32).toString('hex');
  //   const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  //   // Save token and expiry
  //   await this.superadminModelAction.update({
  //     updatePayload: {
  //       reset_token: resetToken,
  //       reset_token_expiry: resetTokenExpiry,
  //     },
  //     identifierOptions: { id: superadmin.id },
  //     transactionOptions: { useTransaction: false },
  //   });

  //   // TODO: Send email with resetToken (stub)
  //   // await this.emailService.sendMail({ ... })

  //   return { message: sysMsg.PASSWORD_RESET_SENT };
  // }

  /**
   * assists a superadmin user to be able to change their password
   * after validating a given jwt token, which has been sent to a
   * user's email through the forgot password method
   *
   * @param resetSuperadminPasswordDto - contains the jwt, new_password,
   * and new_password_confirmation
   */
  // async resetPassword(resetSuperadminPasswordDto: ResetSuperadminPasswordDto) {
  //   const { jwt, password, confirm_password } = resetSuperadminPasswordDto;
  //   // TODO: Verify JWT and extract superadmin id/email
  //   // For now, treat jwt as reset token
  //   const superadmin = await this.superadminModelAction.get({
  //     identifierOptions: { reset_token: jwt },
  //   });
  //   if (!superadmin) {
  //     throw new ConflictException(sysMsg.PASSWORD_RESET_TOKEN_INVALID);
  //   }
  //   if (
  //     superadmin.reset_token_expiry &&
  //     new Date() > superadmin.reset_token_expiry
  //   ) {
  //     throw new ConflictException(sysMsg.PASSWORD_RESET_TOKEN_EXPIRED);
  //   }
  //   if (password !== confirm_password) {
  //     throw new ConflictException(sysMsg.SUPERADMIN_PASSWORDS_REQUIRED);
  //   }
  //   const hashedPassword = await bcrypt.hash(password, 10);
  //   await this.superadminModelAction.update({
  //     updatePayload: {
  //       password: hashedPassword,
  //       reset_token: null,
  //       reset_token_expiry: null,
  //     },
  //     identifierOptions: { id: superadmin.id },
  //     transactionOptions: { useTransaction: false },
  //   });
  //   return { message: sysMsg.PASSWORD_RESET_SUCCESS };
  // }
}
