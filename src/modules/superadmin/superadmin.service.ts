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

  // const t:string = '120m';

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload),
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

    const { hash } = config();
    const password_hash: string = await bcrypt.hash(password, hash.salt);

    const createdSuperadmin = await this.dataSource.transaction(
      async (manager) => {
        const newSuperadmin = await this.superadminModelAction.create({
          createPayload: {
            ...restData,
            email,
            password: password_hash,
            is_active: true,
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

    // Check if active (assuming is_active field)
    if (!superadmin.is_active) {
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
}
