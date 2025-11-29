import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../constants/system.messages';
import { SessionService } from '../session/session.service';

import { CreateSuperadminDto } from './dto/create-superadmin.dto';
import { LoginSuperadminDto } from './dto/login-superadmin.dto';
import { LogoutDto } from './dto/superadmin-logout.dto';
import { SuperAdmin } from './entities/superadmin.entity';
import { SuperadminModelAction } from './model-actions/superadmin-actions';
import { SuperadminService } from './superadmin.service';

describe('SuperadminService', () => {
  let service: SuperadminService;
  let modelAction: SuperadminModelAction;

  const mockLogger = {
    child: jest.fn().mockReturnThis(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  } as unknown as Logger;

  const mockModelActionImpl = {
    get: jest.fn(),
    create: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockSessionService = {
    createSession: jest.fn(),
    revokeSession: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperadminService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
        {
          provide: getRepositoryToken(SuperAdmin),
          useValue: {},
        },
        {
          provide: SuperadminModelAction,
          useValue: mockModelActionImpl,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: SessionService,
          useValue: mockSessionService,
        },
      ],
    }).compile();

    service = module.get<SuperadminService>(SuperadminService);
    modelAction = module.get<SuperadminModelAction>(SuperadminModelAction);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  // Reset mock implementations before each test
  // const resetMocks = () => {
  //   mockModelActionImpl.get.mockReset();
  //   mockModelActionImpl.create.mockReset();
  // };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // create a superadmin's test
  describe('createSuperAdmin', () => {
    const dtoInput: Partial<CreateSuperadminDto> = {
      firstName: 'Test',
      lastName: 'Admin',
      email: 'admin@example.com',
      password: 'password123',
      confirm_password: 'password123',
    };
    const dto = dtoInput as unknown as CreateSuperadminDto;

    it('should create a superadmin and return created data (with password provided)', async () => {
      // modelAction.get should indicate no existing record
      mockModelActionImpl.get.mockResolvedValue(null);

      // stub bcrypt.hash
      const hashSpy = jest.spyOn(bcrypt, 'hash') as unknown as jest.SpyInstance<
        Promise<string>,
        [string, number | string]
      >;
      hashSpy.mockResolvedValue('hashed_pw');

      // mock transaction
      mockDataSource.transaction.mockImplementation(
        async (cb: (manager: Record<string, unknown>) => Promise<unknown>) => {
          const result = await cb({} as Record<string, unknown>);
          return result;
        },
      );

      const createdEntity: SuperAdmin = {
        id: 'uuid-1',
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        password: 'hashed_pw',
        schoolName: 'The Bells University',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        resetToken: null,
        resetTokenExpiration: null,
      };

      mockModelActionImpl.create.mockResolvedValue(createdEntity);

      const result = await service.createSuperAdmin(dto);

      expect(modelAction.get).toHaveBeenCalledWith({
        identifierOptions: { email: dto.email },
      });

      expect(modelAction.create).toHaveBeenCalled();

      expect(result).toHaveProperty(
        'message',
        sysMsg.SUPERADMIN_ACCOUNT_CREATED,
      );
      expect(result).toHaveProperty('status_code');
      expect(result).toHaveProperty('data');
      expect((result.data as Partial<SuperAdmin>).password).toBeUndefined();
    });

    it('should throw ConflictException when passwords are not provided', async () => {
      const badDto = {
        ...dtoInput,
        password: undefined,
        confirm_password: undefined,
      } as unknown as CreateSuperadminDto;

      await expect(service.createSuperAdmin(badDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException when email already exists', async () => {
      const existingSuperAdmin: SuperAdmin = {
        id: 'existing-id',
        firstName: 'Existing',
        lastName: 'User',
        email: 'existing@example.com',
        schoolName: 'Existing School',
        password: 'pw',
        resetToken: null,
        resetTokenExpiration: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockModelActionImpl.get.mockResolvedValue(existingSuperAdmin);

      await expect(service.createSuperAdmin(dto)).rejects.toThrow(
        ConflictException,
      );

      expect(modelAction.get).toHaveBeenCalledWith({
        identifierOptions: { email: dto.email },
      });
    });
  });

  // login's test
  describe('login', () => {
    const loginDto: LoginSuperadminDto = {
      email: 'admin@example.com',
      password: 'password123',
    };

    it('should login a superadmin and return tokens with session info', async () => {
      const superadminEntity: SuperAdmin = {
        id: 'uuid-1',
        firstName: 'Test',
        lastName: 'Admin',
        email: loginDto.email,
        schoolName: 'The Bells University',
        password: 'hashed_pw',
        resetToken: null,
        resetTokenExpiration: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockModelActionImpl.get.mockResolvedValue(superadminEntity);

      // stub bcrypt.compare
      const compareSpy = jest.spyOn(
        bcrypt,
        'compare',
      ) as unknown as jest.SpyInstance<Promise<boolean>, [string, string]>;
      compareSpy.mockResolvedValue(true as never);

      mockJwtService.signAsync
        .mockResolvedValueOnce('access_token_xyz')
        .mockResolvedValueOnce('refresh_token_xyz');

      const sessionInfo = {
        session_id: 'session-uuid',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
      mockSessionService.createSession.mockResolvedValue(sessionInfo);

      const result = await service.login(loginDto);

      expect(modelAction.get).toHaveBeenCalledWith({
        identifierOptions: { email: loginDto.email },
      });

      expect(compareSpy).toHaveBeenCalledWith(
        loginDto.password,
        superadminEntity.password,
      );

      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(mockSessionService.createSession).toHaveBeenCalled();

      expect(result).toHaveProperty('message', sysMsg.LOGIN_SUCCESS);
      expect(result).toHaveProperty('status_code', 200);
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('access_token', 'access_token_xyz');
      expect(result.data).toHaveProperty('refresh_token', 'refresh_token_xyz');
      expect(result.data).toHaveProperty('session_id', 'session-uuid');
      expect(result.data.id).toBe(superadminEntity.id);
      expect(result.data.email).toBe(superadminEntity.email);
    });

    it('should throw ConflictException when superadmin email does not exist', async () => {
      mockModelActionImpl.get.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(ConflictException);

      expect(modelAction.get).toHaveBeenCalledWith({
        identifierOptions: { email: loginDto.email },
      });
    });

    it('should throw ConflictException when superadmin is inactive', async () => {
      const inactiveSuperadmin: SuperAdmin = {
        id: 'uuid-1',
        firstName: 'Test',
        lastName: 'Admin',
        email: loginDto.email,
        schoolName: 'The Bells University',
        password: 'hashed_pw',
        resetToken: null,
        resetTokenExpiration: null,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockModelActionImpl.get.mockResolvedValue(inactiveSuperadmin);

      await expect(service.login(loginDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when password is invalid', async () => {
      const superadminEntity: SuperAdmin = {
        id: 'uuid-1',
        firstName: 'Test',
        lastName: 'Admin',
        email: loginDto.email,
        schoolName: 'The Bells University',
        password: 'hashed_pw',
        resetToken: null,
        resetTokenExpiration: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockModelActionImpl.get.mockResolvedValue(superadminEntity);

      // stub bcrypt.compare to return false
      const compareSpy = jest.spyOn(
        bcrypt,
        'compare',
      ) as unknown as jest.SpyInstance<Promise<boolean>, [string, string]>;
      compareSpy.mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(ConflictException);

      expect(compareSpy).toHaveBeenCalledWith(
        loginDto.password,
        superadminEntity.password,
      );
    });

    it('should log success message after successful login', async () => {
      const superadminEntity: SuperAdmin = {
        id: 'uuid-1',
        firstName: 'Test',
        lastName: 'Admin',
        email: loginDto.email,
        schoolName: 'The Bells University',
        password: 'hashed_pw',
        resetToken: null,
        resetTokenExpiration: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockModelActionImpl.get.mockResolvedValue(superadminEntity);

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      mockJwtService.signAsync
        .mockResolvedValueOnce('access_token_xyz')
        .mockResolvedValueOnce('refresh_token_xyz');

      mockSessionService.createSession.mockResolvedValue({
        session_id: 'session-uuid',
        expires_at: new Date(),
      });

      await service.login(loginDto);

      expect(mockLogger.info).toHaveBeenCalledWith(sysMsg.LOGIN_SUCCESS);
    });
  });

  // logout's test
  describe('logout', () => {
    it('should successfully revoke session and return success message', async () => {
      const logoutDto: LogoutDto = {
        user_id: 'user-id-123',
        session_id: 'session-id-456',
      };

      mockSessionService.revokeSession.mockResolvedValue(undefined);

      const result = await service.logout(logoutDto);

      expect(mockSessionService.revokeSession).toHaveBeenCalledWith(
        logoutDto.user_id,
        logoutDto.session_id,
      );
      expect(mockLogger.info).toHaveBeenCalledWith(sysMsg.LOGOUT_SUCCESS);
      expect(result).toEqual({ message: sysMsg.LOGOUT_SUCCESS });
    });

    it('should handle session service not being available', async () => {
      const logoutDto = {
        user_id: 'user-id-123',
        session_id: 'session-id-456',
      };

      const moduleWithoutSession: TestingModule =
        await Test.createTestingModule({
          providers: [
            SuperadminService,
            {
              provide: WINSTON_MODULE_PROVIDER,
              useValue: mockLogger,
            },
            {
              provide: getRepositoryToken(SuperAdmin),
              useValue: {},
            },
            {
              provide: SuperadminModelAction,
              useValue: mockModelActionImpl,
            },
            {
              provide: DataSource,
              useValue: mockDataSource,
            },
            {
              provide: JwtService,
              useValue: mockJwtService,
            },
            {
              provide: SessionService,
              useValue: null,
            },
          ],
        }).compile();

      const serviceWithoutSession =
        moduleWithoutSession.get<SuperadminService>(SuperadminService);

      const result = await serviceWithoutSession.logout(logoutDto);

      expect(result).toEqual({ message: sysMsg.LOGOUT_SUCCESS });
      expect(mockLogger.info).toHaveBeenCalledWith(sysMsg.LOGOUT_SUCCESS);
    });

    it('should pass correct parameters to revoke session', async () => {
      const logoutDto: LogoutDto = {
        user_id: 'different-user-id',
        session_id: 'different-session-id',
      };

      mockSessionService.revokeSession.mockResolvedValue(undefined);

      await service.logout(logoutDto);

      expect(mockSessionService.revokeSession).toHaveBeenCalledWith(
        'different-user-id',
        'different-session-id',
      );
      expect(mockSessionService.revokeSession).toHaveBeenCalledTimes(1);
    });

    it('should log success message after logout', async () => {
      const logoutDto: LogoutDto = {
        user_id: 'user-id-123',
        session_id: 'session-id-456',
      };

      mockSessionService.revokeSession.mockResolvedValue(undefined);

      await service.logout(logoutDto);

      expect(mockLogger.info).toHaveBeenCalledWith(sysMsg.LOGOUT_SUCCESS);
    });

    it('should handle session revoke errors gracefully', async () => {
      const logoutDto: LogoutDto = {
        user_id: 'user-id-123',
        session_id: 'session-id-456',
      };

      const error = new Error('Session revocation failed');
      mockSessionService.revokeSession.mockRejectedValue(error);

      await expect(service.logout(logoutDto)).rejects.toThrow(
        'Session revocation failed',
      );
      expect(mockSessionService.revokeSession).toHaveBeenCalledWith(
        logoutDto.user_id,
        logoutDto.session_id,
      );
    });
  });
});
