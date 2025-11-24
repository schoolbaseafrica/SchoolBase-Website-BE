import * as crypto from 'crypto';

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import config from '../../config/config';
import { EmailTemplateID } from '../../constants/email-constants';
import * as sysMsg from '../../constants/system.messages';
import { EmailService } from '../email/email.service';
import { EmailPayload } from '../email/email.types';
import { SessionService } from '../session/session.service';
import { UserService } from '../user/user.service';

import {
  AuthDto,
  ForgotPasswordDto,
  LogoutDto,
  RefreshTokenDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger: Logger;
  constructor(
    private readonly userService: UserService,
    @Inject(WINSTON_MODULE_PROVIDER) logger: Logger,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly sessionService: SessionService,
  ) {
    this.logger = logger.child({ context: AuthService.name });
  }

  async signup(signupPayload: AuthDto) {
    // Check if user already exists
    const existingUser = await this.userService.findByEmail(
      signupPayload.email,
    );
    if (existingUser) {
      throw new ConflictException(sysMsg.ACCOUNT_ALREADY_EXISTS);
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      signupPayload.password,
      saltRounds,
    );

    // Create user
    const newUser = await this.userService.create({
      ...signupPayload,
      password: hashedPassword,
    });

    // Generate tokens
    const tokens = await this.generateTokens(
      newUser.id,
      newUser.email,
      newUser.role,
    );

    // Create session in DB
    let sessionInfo = null;
    if (this.sessionService && tokens.refresh_token) {
      sessionInfo = await this.sessionService.createSession(
        newUser.id,
        tokens.refresh_token,
      );
    }

    this.logger.info(sysMsg.ACCOUNT_CREATED);

    return {
      message: sysMsg.ACCOUNT_CREATED,
      user: {
        id: newUser.id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role,
      },
      ...tokens,
      session_id: sessionInfo?.session_id,
      session_expires_at: sessionInfo?.expires_at,
    };
  }

  async login(loginPayload: LoginDto) {
    // Find user by email
    const user = await this.userService.findByEmail(loginPayload.email);
    if (!user) {
      throw new UnauthorizedException(sysMsg.INVALID_CREDENTIALS);
    }

    // Check if user is active
    if (!user.is_active) {
      this.logger.warn('Login attempt on inactive account');
      throw new UnauthorizedException(sysMsg.USER_INACTIVE);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginPayload.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(sysMsg.INVALID_CREDENTIALS);
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    let sessionInfo = null;
    if (this.sessionService && tokens.refresh_token) {
      sessionInfo = await this.sessionService.createSession(
        user.id,
        tokens.refresh_token,
      );
    }

    this.logger.info(sysMsg.LOGIN_SUCCESS);

    return {
      message: sysMsg.LOGIN_SUCCESS,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      },
      ...tokens,
      session_id: sessionInfo?.session_id,
      session_expires_at: sessionInfo?.expires_at,
    };
  }

  async refreshToken(refreshToken: RefreshTokenDto) {
    const payload = await this.jwtService.verifyAsync(
      refreshToken.refresh_token,
      {
        secret: config().jwt.refreshSecret,
      },
    );

    const tokens = await this.generateTokens(
      payload.sub,
      payload.email,
      payload.role,
    );

    // Create session in DB
    let sessionInfo = null;
    if (this.sessionService && tokens.refresh_token) {
      sessionInfo = await this.sessionService.createSession(
        payload.sub,
        tokens.refresh_token,
      );
    }

    this.logger.info(sysMsg.TOKEN_REFRESH_SUCCESS);

    return {
      message: sysMsg.TOKEN_REFRESH_SUCCESS,
      ...tokens,
      session_id: sessionInfo?.session_id,
      session_expires_at: sessionInfo?.expires_at,
    };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;
    const user = await this.userService.findByEmail(email);

    if (!user) {
      this.logger.info(
        `Password reset requested for non-existent email: ${email}`,
      );
      return {
        message: 'If the email exists, a password reset link has been sent',
      };
    }

    // Check if user is active
    if (!user.is_active) {
      this.logger.warn(
        `Password reset requested for inactive account: ${email}`,
      );
      return {
        message: 'If the email exists, a password reset link has been sent',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await this.userService.updateUser(
      {
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry,
      },
      { id: user.id },
      { useTransaction: false },
    );

    const emailpayload: EmailPayload = {
      to: [{ name: user.first_name, email: user.email }],
      subject: 'Password Reset Request',
      templateNameID: EmailTemplateID.FORGOT_PASSWORD,
      templateData: {
        name: user.first_name,
        otp: resetToken,
        resetTokenExpiry,
      },
    };
    this.emailService.sendMail(emailpayload);
    this.logger.info(`Password reset token for ${email}: ${resetToken}`);

    return {
      message: 'Password reset token has been sent',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;
    const user = await this.userService.findByResetToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (user.reset_token_expiry && new Date() > user.reset_token_expiry) {
      throw new BadRequestException('Reset token has expired');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    await this.userService.updateUser(
      {
        password: hashedPassword,
        reset_token: null,
        reset_token_expiry: null,
      },
      { id: user.id },
      { useTransaction: false },
    );

    this.logger.info(`Password successfully reset for user: ${user.email}`);

    return { message: 'Password has been successfully reset' };
  }

  async activateUserAccount(id: string) {
    const user = await this.userService.findOne(id);

    if (!user) throw new NotFoundException(sysMsg.USER_NOT_FOUND);

    if (user.is_active) {
      return sysMsg.USER_IS_ACTIVATED;
    }

    await this.userService.updateUser(
      {
        is_active: true,
      },
      { id },
      { useTransaction: false },
    );

    return sysMsg.USER_ACTIVATED;
  }

  async getProfile(accessToken: string) {
    if (!accessToken) {
      throw new UnauthorizedException(sysMsg.AUTHORIZATION_HEADER_MISSING);
    }

    // Extract token from "Bearer <token>"
    const token = accessToken.replace('Bearer ', '');

    const decryptedToken = await this.jwtService.verifyAsync(token, {
      secret: config().jwt.secret,
    });

    if (!decryptedToken.email) {
      this.logger.error(`${sysMsg.TOKEN_INVALID} or ${sysMsg.TOKEN_EXPIRED}`);
      throw new UnauthorizedException(
        `${sysMsg.TOKEN_INVALID} or ${sysMsg.TOKEN_EXPIRED}`,
      );
    }

    const user = await this.userService.findByEmail(decryptedToken.email);
    if (!user) {
      this.logger.error(sysMsg.USER_NOT_FOUND);
      throw new UnauthorizedException(sysMsg.USER_NOT_FOUND);
    }

    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      middle_name: user.middle_name,
      role: user.role,
      gender: user.gender,
      dob: user.dob,
      phone: user.phone,
      is_active: user.is_active,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    };
  }

  private async generateTokens(userId: string, email: string, role: string[]) {
    const { jwt } = config();
    const payload = { sub: userId, email, role };

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

  async logout(logoutPayload: LogoutDto) {
    if (this.sessionService) {
      await this.sessionService.revokeSession(
        logoutPayload.user_id,
        logoutPayload.session_id,
      );
    }

    this.logger.info(sysMsg.LOGOUT_SUCCESS);

    return {
      message: sysMsg.LOGOUT_SUCCESS,
    };
  }
}
