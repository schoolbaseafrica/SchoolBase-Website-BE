import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import { UserService } from '../user/user.service';
import { EmailService } from '../email/email.service';
import { WaitlistService } from '../waitlist/waitlist.service';

import { AuthDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { LoginDto } from './dto/login.dto';

import { EmailPayload } from '../email/email.types';
import { EmailTemplateID } from 'src/constants/email-constants';

@Injectable()
export class AuthService {
  private readonly logger: Logger;
  constructor(
    private readonly userService: UserService,
    @Inject(WINSTON_MODULE_PROVIDER) logger: Logger,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {
    this.logger = logger.child({ context: AuthService.name });
  }

  async signup(signupPayload: AuthDto) {
    // Check if user already exists
    const existingUser = await this.userService.findByEmail(
      signupPayload.email,
    );
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
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

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role,
      },
      ...tokens,
    };
  }

  async login(loginPayload: LoginDto) {
    // Find user by email
    const user = await this.userService.findByEmail(loginPayload.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginPayload.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const tokens = await this.generateTokens(
        payload.sub,
        payload.email,
        payload.role,
      );

      return tokens;
    } catch (error) {
      this.logger.error('Invalid refresh token: ', error?.message);
      throw new UnauthorizedException('Invalid refresh token');
    }
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

  private async generateTokens(userId: string, email: string, role: string[]) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }
}
