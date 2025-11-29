import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { OAuth2Client } from 'google-auth-library';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import * as sysMSG from '../../constants/system.messages';
import { EmailService } from '../email/email.service';
import { InviteModelAction } from '../invites/invite.model-action';
import { SessionService } from '../session/session.service';
import { UserService } from '../user/user.service';

import { AuthService } from './auth.service';

// Mock the config module
jest.mock('../../config/config', () => {
  return {
    __esModule: true, // eslint-disable-line @typescript-eslint/naming-convention
    default: jest.fn(() => ({
      jwt: {
        secret: 'test-secret',
        refreshSecret: 'test-refresh-secret',
      },
      google: {
        clientId: 'test-client-id',
      },
    })),
  };
});

jest.mock('google-auth-library');

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
    validateRefreshToken: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockInviteModelAction = {
    get: jest.fn(),
    update: jest.fn(),
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
        {
          provide: InviteModelAction,
          useValue: mockInviteModelAction,
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
            {
              provide: InviteModelAction,
              useValue: mockInviteModelAction,
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

  describe('refreshToken', () => {
    const mockRefreshTokenDto = {
      refresh_token: 'valid-refresh-token',
    };

    const mockJwtPayload = {
      sub: 'user-id-123',
      email: 'test@example.com',
      role: ['STUDENT'],
    };

    const mockOldSession = {
      id: 'session-id-456',
      user_id: 'user-id-123',
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockJwtService.verifyAsync.mockResolvedValue(mockJwtPayload);
      mockJwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');
      mockSessionService.validateRefreshToken.mockResolvedValue(mockOldSession);
      mockSessionService.revokeSession.mockResolvedValue({
        revoked: true,
        session_id: 'session-id-456',
      });
      mockSessionService.createSession.mockResolvedValue({
        session_id: 'new-session-id',
        expires_at: new Date(),
      });
    });

    it('should successfully refresh tokens when refresh token is valid', async () => {
      const result = await service.refreshToken(mockRefreshTokenDto);

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(
        mockRefreshTokenDto.refresh_token,
        { secret: expect.any(String) },
      );
      expect(mockSessionService.validateRefreshToken).toHaveBeenCalledWith(
        mockJwtPayload.sub,
        mockRefreshTokenDto.refresh_token,
      );
      expect(mockSessionService.revokeSession).toHaveBeenCalledWith(
        mockOldSession.id,
        mockJwtPayload.sub,
      );
      expect(mockSessionService.createSession).toHaveBeenCalledWith(
        mockJwtPayload.sub,
        'new-refresh-token',
      );
      expect(result).toHaveProperty('access_token', 'new-access-token');
      expect(result).toHaveProperty('refresh_token', 'new-refresh-token');
      expect(result).toHaveProperty('message');
    });

    it('should throw UnauthorizedException when refresh token validation fails', async () => {
      mockSessionService.validateRefreshToken.mockResolvedValue(null);

      await expect(service.refreshToken(mockRefreshTokenDto)).rejects.toThrow(
        'Invalid or expired refresh token. Please login again.',
      );

      expect(mockSessionService.validateRefreshToken).toHaveBeenCalled();
      expect(mockSessionService.revokeSession).not.toHaveBeenCalled();
      expect(mockSessionService.createSession).not.toHaveBeenCalled();
    });

    it('should throw error when JWT verification fails', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(
        new Error('Invalid token signature'),
      );

      await expect(service.refreshToken(mockRefreshTokenDto)).rejects.toThrow(
        'Invalid token signature',
      );

      expect(mockSessionService.validateRefreshToken).not.toHaveBeenCalled();
    });

    it('should handle case when session service is not available', async () => {
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
            {
              provide: InviteModelAction,
              useValue: mockInviteModelAction,
            },
          ],
        }).compile();

      const serviceWithoutSession =
        moduleWithoutSession.get<AuthService>(AuthService);

      const result =
        await serviceWithoutSession.refreshToken(mockRefreshTokenDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(mockJwtService.verifyAsync).toHaveBeenCalled();
    });

    it('should generate new tokens with correct payload', async () => {
      await service.refreshToken(mockRefreshTokenDto);

      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: mockJwtPayload.sub,
          email: mockJwtPayload.email,
          role: mockJwtPayload.role,
        },
        expect.objectContaining({
          secret: expect.any(String),
          expiresIn: expect.any(String),
        }),
      );
    });
  });

  describe('googleLogin', () => {
    const mockGoogleToken = 'valid-google-token';
    const mockInviteToken = 'valid-invite-token';
    const mockGooglePayload = {
      email: 'test@example.com',
      sub: 'google-id-123',
      given_name: 'John',
      family_name: 'Doe',
      picture: 'http://example.com/pic.jpg',
    };

    const mockInvite = {
      id: 'invite-id-123',
      email: 'test@example.com',
      token_hash: 'hashed-token',
      expires_at: new Date(Date.now() + 86400000), // Tomorrow
      status: 'pending',
      accepted: false,
      role: 'STUDENT',
      full_name: 'John Doe',
    };

    beforeEach(() => {
      // Clear mocks
      jest.clearAllMocks();
    });

    it('should login existing user successfully', async () => {
      const existingUser = {
        id: 'user-id-123',
        email: 'test@example.com',
        google_id: 'google-id-123',
        role: ['STUDENT'],
        is_active: true,
      };

      mockUserService.findByEmail.mockResolvedValue(existingUser);
      mockJwtService.signAsync.mockResolvedValue('token');
      mockSessionService.createSession.mockResolvedValue({
        session_id: 'session-id',
        expires_at: new Date(),
      });
      // Mock OAuth2Client behavior manually since jest.mock is hoisted
      (OAuth2Client as unknown as jest.Mock).mockImplementation(() => ({
        verifyIdToken: jest.fn().mockResolvedValue({
          getPayload: jest.fn().mockReturnValue(mockGooglePayload),
        }),
      }));
      const result = await service.googleLogin(mockGoogleToken);

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(
        mockGooglePayload.email,
      );
      expect(result).toHaveProperty('access_token');
    });

    it('should update existing user with google_id if missing', async () => {
      const existingUser = {
        id: 'user-id-123',
        email: 'test@example.com',
        google_id: null,
        role: ['STUDENT'],
        is_active: true,
      };

      mockUserService.findByEmail.mockResolvedValue(existingUser);
      mockJwtService.signAsync.mockResolvedValue('token');

      // Mock OAuth2Client behavior manually since jest.mock is hoisted
      (OAuth2Client as unknown as jest.Mock).mockImplementation(() => ({
        verifyIdToken: jest.fn().mockResolvedValue({
          getPayload: jest.fn().mockReturnValue(mockGooglePayload),
        }),
      }));

      await service.googleLogin(mockGoogleToken);

      expect(mockUserService.updateUser).toHaveBeenCalledWith(
        { google_id: mockGooglePayload.sub },
        { id: existingUser.id },
        { useTransaction: false },
      );
    });

    it('should throw ForbiddenException if new user provides no invite token', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      // Mock OAuth2Client behavior manually since jest.mock is hoisted
      (OAuth2Client as unknown as jest.Mock).mockImplementation(() => ({
        verifyIdToken: jest.fn().mockResolvedValue({
          getPayload: jest.fn().mockReturnValue(mockGooglePayload),
        }),
      }));

      await expect(service.googleLogin(mockGoogleToken)).rejects.toThrow(
        'Registration is by invitation only',
      );
    });

    it('should throw NotFoundException if invite token is invalid', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);
      mockInviteModelAction.get.mockResolvedValue(null);

      // Mock OAuth2Client behavior manually since jest.mock is hoisted
      (OAuth2Client as unknown as jest.Mock).mockImplementation(() => ({
        verifyIdToken: jest.fn().mockResolvedValue({
          getPayload: jest.fn().mockReturnValue(mockGooglePayload),
        }),
      }));

      await expect(
        service.googleLogin(mockGoogleToken, mockInviteToken),
      ).rejects.toThrow(sysMSG.INVALID_VERIFICATION_TOKEN);
    });

    it('should throw ConflictException if invite email does not match Google email', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);
      mockInviteModelAction.get.mockResolvedValue({
        ...mockInvite,
        email: 'other@example.com',
      });

      // Mock OAuth2Client behavior manually since jest.mock is hoisted
      (OAuth2Client as unknown as jest.Mock).mockImplementation(() => ({
        verifyIdToken: jest.fn().mockResolvedValue({
          getPayload: jest.fn().mockReturnValue(mockGooglePayload),
        }),
      }));

      await expect(
        service.googleLogin(mockGoogleToken, mockInviteToken),
      ).rejects.toThrow(
        'The email associated with this invite does not match your Google email.',
      );
    });

    it('should create new user and accept invite if valid', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);
      mockInviteModelAction.get.mockResolvedValue(mockInvite);
      mockUserService.create.mockResolvedValue({
        id: 'new-user-id',
        email: mockGooglePayload.email,
        role: ['STUDENT'],
        first_name: 'John',
        last_name: 'Doe',
      });
      mockJwtService.signAsync.mockResolvedValue('token');

      // Mock OAuth2Client behavior manually since jest.mock is hoisted
      (OAuth2Client as unknown as jest.Mock).mockImplementation(() => ({
        verifyIdToken: jest.fn().mockResolvedValue({
          getPayload: jest.fn().mockReturnValue(mockGooglePayload),
        }),
      }));

      await service.googleLogin(mockGoogleToken, mockInviteToken);

      expect(mockUserService.create).toHaveBeenCalled();
      expect(mockInviteModelAction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          identifierOptions: { id: mockInvite.id },
          updatePayload: expect.objectContaining({ accepted: true }),
        }),
      );
    });
  });
});
