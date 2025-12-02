import * as crypto from 'crypto';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import config from '../../config/config';
import { EmailTemplateID } from '../../constants/email-constants';
import * as sysMsg from '../../constants/system.messages';
import { EmailService } from '../email/email.service';
import { EmailPayload } from '../email/email.types';
import { InviteStatus } from '../invites/entities/invites.entity';
import { InviteModelAction } from '../invites/invite.model-action';
import { SessionService } from '../session/session.service';
import { UserService } from '../user/user.service';

import {
  AuthDto,
  ForgotPasswordDto,
  LogoutDto,
  RefreshTokenDto,
  ResetPasswordDto,
  UserRole,
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
    private readonly configService: ConfigService,
    private readonly inviteModelAction: InviteModelAction,
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
    // Verify the refresh token signature
    const payload = await this.jwtService.verifyAsync(
      refreshToken.refresh_token,
      {
        secret: config().jwt.refreshSecret,
      },
    );

    // Validate refresh token against stored session
    let oldSession = null;
    if (this.sessionService) {
      oldSession = await this.sessionService.validateRefreshToken(
        payload.sub,
        refreshToken.refresh_token,
      );

      if (!oldSession) {
        this.logger.warn(
          `Refresh token validation failed for user: ${payload.sub}`,
        );
        throw new UnauthorizedException(
          'Invalid or expired refresh token. Please login again.',
        );
      }
    }

    // Generate new tokens
    const tokens = await this.generateTokens(
      payload.sub,
      payload.email,
      payload.role,
    );

    // Update session with new refresh token
    let sessionInfo = null;
    if (this.sessionService && tokens.refresh_token && oldSession) {
      // Revoke old session and create new one
      await this.sessionService.revokeSession(oldSession.id, payload.sub);

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
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    await this.userService.updateUser(
      {
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry,
      },
      { id: user.id },
      { useTransaction: false },
    );

    const FRONTEND_URL = this.configService.get<string>('frontend.url');
    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    const emailpayload: EmailPayload = {
      to: [{ name: user.first_name, email: user.email }],
      subject: 'Password Reset Request',
      templateNameID: EmailTemplateID.FORGOT_PASSWORD,
      templateData: {
        name: user.first_name,
        resetLink: resetLink,
        resetTokenExpiry,
      },
    };
    this.emailService.sendMail(emailpayload);
    this.logger.info(`Password reset token for ${email}: ${resetToken}`);

    return {
      message: sysMsg.PASSWORD_RESET_TOKEN_SENT,
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

    return { message: sysMsg.PASSWORD_RESET_SUCCESS };
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
        expiresIn: '4h',
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
        logoutPayload.session_id,
        logoutPayload.user_id,
      );
    }

    this.logger.info(sysMsg.LOGOUT_SUCCESS);

    return {
      message: sysMsg.LOGOUT_SUCCESS,
    };
  }

  async googleLogin(token: string, inviteToken?: string) {
    const { google } = config();
    const client = new OAuth2Client(google.clientId);

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: google.clientId,
    });
    const payload = ticket.getPayload();

    if (!payload) {
      throw new UnauthorizedException(sysMsg.INVALID_GOOGLE_TOKEN);
    }

    const { email, sub: googleId, given_name, family_name, picture } = payload;

    let user = await this.userService.findByEmail(email);

    if (user) {
      // If user exists but doesn't have google_id, update it
      if (!user.google_id) {
        await this.userService.updateUser(
          { google_id: googleId },
          { id: user.id },
          { useTransaction: false },
        );
      }
    } else {
      // User does not exist, check for invite
      if (!inviteToken) {
        throw new ForbiddenException(sysMsg.REGISTRATION_INVITE_ONLY);
      }

      // Verify invite
      const hashedToken = crypto
        .createHash('sha256')
        .update(inviteToken)
        .digest('hex');

      const invite = await this.inviteModelAction.get({
        identifierOptions: {
          token_hash: hashedToken,
          status: InviteStatus.PENDING,
        },
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

      // Critical: Check if invite email matches Google email
      if (invite.email.toLowerCase() !== email.toLowerCase()) {
        throw new ConflictException(sysMsg.INVITE_EMAIL_MISMATCH);
      }

      // Create new user
      const password = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(password, 10);

      const names = invite.full_name
        ? invite.full_name.split(' ')
        : [given_name, family_name];
      const firstName = names[0] || given_name;
      const lastName = names.slice(1).join(' ') || family_name || '';

      user = await this.userService.create({
        email,
        first_name: firstName,
        last_name: lastName,
        middle_name: '',
        password: hashedPassword,
        google_id: googleId,
        is_active: true,
        is_verified: true,
        role: [invite.role as UserRole], // Use role from invite
        gender: 'Other',
        dob: new Date().toISOString().split('T')[0],
        phone: '',
      });

      // Mark invite as accepted
      await this.inviteModelAction.update({
        identifierOptions: { id: invite.id },
        updatePayload: {
          accepted: true,
          status: InviteStatus.USED,
        },
        transactionOptions: { useTransaction: false },
      });
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Create session
    let sessionInfo = null;
    if (this.sessionService && tokens.refresh_token) {
      sessionInfo = await this.sessionService.createSession(
        user.id,
        tokens.refresh_token,
      );
    }

    return {
      message: sysMsg.LOGIN_SUCCESS,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        picture,
      },
      ...tokens,
      session_id: sessionInfo?.session_id,
      session_expires_at: sessionInfo?.expires_at,
    };
  }
}
