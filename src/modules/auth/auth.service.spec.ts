import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import * as sysMSG from '../../constants/system.messages';
import { EmailService } from '../email/email.service';
import { SessionService } from '../session/session.service';
import { UserService } from '../user/user.service';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let sessionService: SessionService;

  const mockUserService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    updateUser: jest.fn(),
    findByResetToken: jest.fn(),
  };

  const mockLogger = {
    child: jest.fn().mockReturnThis(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  } as unknown as Logger;

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockEmailService = {
    sendMail: jest.fn(),
  };

  const mockSessionService = {
    createSession: jest.fn(),
    revokeSession: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: SessionService,
          useValue: mockSessionService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    sessionService = module.get<SessionService>(SessionService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logout', () => {
    it('should successfully revoke session and return success message', async () => {
      const logoutDto = {
        user_id: 'user-id-123',
        session_id: 'session-id-456',
      };

      mockSessionService.revokeSession.mockResolvedValue(undefined);

      const result = await service.logout(logoutDto);

      expect(sessionService.revokeSession).toHaveBeenCalledWith(
        logoutDto.user_id,
        logoutDto.session_id,
      );
      expect(mockLogger.info).toHaveBeenCalledWith(sysMSG.LOGOUT_SUCCESS);
      expect(result).toEqual({
        message: sysMSG.LOGOUT_SUCCESS,
      });
    });

    it('should handle session service not being available', async () => {
      const logoutDto = {
        user_id: 'user-id-123',
        session_id: 'session-id-456',
      };

      const moduleWithoutSession: TestingModule =
        await Test.createTestingModule({
          providers: [
            AuthService,
            {
              provide: UserService,
              useValue: mockUserService,
            },
            {
              provide: WINSTON_MODULE_PROVIDER,
              useValue: mockLogger,
            },
            {
              provide: JwtService,
              useValue: mockJwtService,
            },
            {
              provide: EmailService,
              useValue: mockEmailService,
            },
            {
              provide: SessionService,
              useValue: null,
            },
            {
              provide: ConfigService,
              useValue: mockConfigService,
            },
          ],
        }).compile();

      const serviceWithoutSession =
        moduleWithoutSession.get<AuthService>(AuthService);
      jest.clearAllMocks();

      const result = await serviceWithoutSession.logout(logoutDto);

      expect(result).toEqual({
        message: sysMSG.LOGOUT_SUCCESS,
      });
      expect(mockLogger.info).toHaveBeenCalledWith(sysMSG.LOGOUT_SUCCESS);
    });

    it('should pass correct parameters to revoke session', async () => {
      const logoutDto = {
        user_id: 'different-user-id',
        session_id: 'different-session-id',
      };

      mockSessionService.revokeSession.mockResolvedValue(undefined);

      await service.logout(logoutDto);

      expect(sessionService.revokeSession).toHaveBeenCalledWith(
        'different-user-id',
        'different-session-id',
      );
      expect(sessionService.revokeSession).toHaveBeenCalledTimes(1);
    });

    it('should log success message after logout', async () => {
      const logoutDto = {
        user_id: 'user-id-123',
        session_id: 'session-id-456',
      };

      mockSessionService.revokeSession.mockResolvedValue(undefined);

      await service.logout(logoutDto);

      expect(mockLogger.info).toHaveBeenCalledWith(sysMSG.LOGOUT_SUCCESS);
    });

    it('should handle session revoke errors gracefully', async () => {
      const logoutDto = {
        user_id: 'user-id-123',
        session_id: 'session-id-456',
      };

      const error = new Error('Session revocation failed');
      mockSessionService.revokeSession.mockRejectedValue(error);

      await expect(service.logout(logoutDto)).rejects.toThrow(
        'Session revocation failed',
      );
      expect(sessionService.revokeSession).toHaveBeenCalledWith(
        logoutDto.user_id,
        logoutDto.session_id,
      );
    });
  });
});
