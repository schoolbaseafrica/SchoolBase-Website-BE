import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as qrCode from 'qrcode';
import * as speakeasy from 'speakeasy';
import { Repository } from 'typeorm';

import { SYS_MSG } from '../../constants/system-messages';
import { User } from '../user/entities/user.entity';

import { User2fa } from './entities/user-2fa.entity';

export interface IEnable2faData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface IEnable2faResponse {
  status_code: HttpStatus;
  message: string;
  data: IEnable2faData;
}

//Service for Two-Factor Authentication
@Injectable()
export class TwoFactorAuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(User2fa)
    private readonly user2faRepository: Repository<User2fa>,
  ) {}

  /**
   * Enable 2FA for a user
   * Generates a new secret, creates QR code, and generates backup codes
   */
  async enable2fa(userId: string): Promise<IEnable2faResponse> {
    // Find the user
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(SYS_MSG.userNotFound);
    }

    // Generate a secret for the user
    const secret = speakeasy.generateSecret({
      name: `OpenSchoolPortal (${user.email})`,
      issuer: 'Open School Portal',
      length: 32,
    });

    // Generate QR code URL
    const qrCodeUrl = await qrCode.toDataURL(secret.otpauth_url as string);

    // Generate backup codes (8 codes, each 8 characters)
    const backupCodes = this.generateBackupCodes(8, 8);

    // Check if user already has 2FA record
    let user2fa = await this.user2faRepository.findOne({
      where: { userId },
    });

    if (user2fa) {
      // Update existing record
      user2fa.twoFaSecret = secret.base32;
      user2fa.backupCodes = backupCodes;
      user2fa.twoFaEnabled = false; // Will be enabled after successful verification
    } else {
      // Create new 2FA record
      user2fa = this.user2faRepository.create({
        userId,
        twoFaSecret: secret.base32,
        backupCodes,
        twoFaEnabled: false,
      });
    }

    await this.user2faRepository.save(user2fa);

    return {
      status_code: HttpStatus.OK,
      message: SYS_MSG.twoFactorAuthEnabledSuccessfully,
      data: {
        secret: secret.base32,
        qrCodeUrl,
        backupCodes,
      },
    };
  }

  /**
   * Generate backup codes
   * @param count Number of codes to generate
   * @param length Length of each code
   */
  private generateBackupCodes(count: number, length: number): string[] {
    const codes: string[] = [];
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    for (let i = 0; i < count; i++) {
      let code = '';
      for (let j = 0; j < length; j++) {
        code += characters.charAt(
          Math.floor(Math.random() * characters.length),
        );
      }
      codes.push(code);
    }

    return codes;
  }
}
