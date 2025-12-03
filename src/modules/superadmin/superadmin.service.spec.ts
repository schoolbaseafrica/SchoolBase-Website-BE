import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../constants/system.messages';
import { EmailService } from '../email/email.service';

import { CreateSuperadminDto } from './dto/create-superadmin.dto';
import { LoginSuperadminDto } from './dto/login-superadmin.dto';
import { LogoutDto } from './dto/superadmin-logout.dto';
import { Role, SuperAdmin } from './entities/superadmin.entity';
import { SuperadminModelAction } from './model-actions/superadmin-actions';
import { SuperadminSessionService } from './session/superadmin-session.service';
import { SuperadminService } from './superadmin.service';

describe('SuperadminService', () => {
  let service: SuperadminService;
  let model_action: SuperadminModelAction;

  const mockLogger = {
    child: jest.fn().mockReturnThis(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  } as unknown as Logger;

  const mock_model_action_impl = {
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mock_data_source = {
    transaction: jest.fn(),
  };

  const mock_jwt_service = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mock_superadmin_session_service = {
    createSession: jest.fn(),
    revokeSession: jest.fn(),
  };

  const mock_email_service = {
    sendMail: jest.fn(),
  };

  const mock_config_service = {
    get: jest.fn().mockReturnValue('some-mock-value'),
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
          useValue: mock_model_action_impl,
        },
        {
          provide: DataSource,
          useValue: mock_data_source,
        },
        {
          provide: JwtService,
          useValue: mock_jwt_service,
        },
        {
          provide: SuperadminSessionService,
          useValue: mock_superadmin_session_service,
        },
        {
          provide: EmailService,
          useValue: mock_email_service,
        },
        {
          provide: ConfigService,
          useValue: mock_config_service,
        },
      ],
    }).compile();

    service = module.get<SuperadminService>(SuperadminService);
    model_action = module.get<SuperadminModelAction>(SuperadminModelAction);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // create a superadmin's test
  describe('createSuperAdmin', () => {
    const dtoInput: Partial<CreateSuperadminDto> = {
      first_name: 'Test',
      last_name: 'Admin',
      email: 'admin@example.com',
      password: 'password123',
      confirm_password: 'password123',
    };
    const dto = dtoInput as unknown as CreateSuperadminDto;

    it('should create a new superadmin if one does not exist', async () => {
      mock_model_action_impl.get.mockResolvedValue(null);
      const hashSpy = jest.spyOn(bcrypt, 'hash') as unknown as jest.SpyInstance<
        Promise<string>,
        [string | Buffer, string | number]
      >;
      hashSpy.mockResolvedValue('hashed_pw');
      mock_data_source.transaction.mockImplementation(
        async (cb: (manager: Record<string, unknown>) => Promise<unknown>) => {
          const result = await cb({} as Record<string, unknown>);
          return result;
        },
      );
      const createdEntity: SuperAdmin = {
        id: 'uuid-1',
        email: dto.email,
        first_name: dto.first_name,
        last_name: dto.last_name,
        password: 'hashed_pw',
        school_name: 'The Bells University',
        is_active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        reset_token: null,
        reset_token_expiration: null,
        sessions: [],
        role: Role.SUPERADMIN,
      };
      mock_model_action_impl.create.mockResolvedValue(createdEntity);
      mock_email_service.sendMail.mockResolvedValue(undefined);
      const result = await service.createSuperAdmin(dto);

      expect(model_action.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            role: Role.SUPERADMIN,
          }),
        }),
      );
      expect(mock_email_service.sendMail).toHaveBeenCalled();
      expect(result.message).toBe(sysMsg.SUPERADMIN_ACCOUNT_CREATED);
      expect(result.status_code).toBe(201);
    });

    it('should update an existing superadmin if one exists', async () => {
      const existingSuperadmin: SuperAdmin = {
        id: 'uuid-1',
        email: dto.email,
        first_name: 'Old Name',
        last_name: 'Old Last Name',
        password: 'old_hashed_pw',
        school_name: 'Old School',
        is_active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        reset_token: null,
        reset_token_expiration: null,
        sessions: [],
        role: Role.SUPERADMIN,
      };

      mock_model_action_impl.get.mockResolvedValue(existingSuperadmin);

      const hashSpy = jest.spyOn(bcrypt, 'hash') as unknown as jest.SpyInstance<
        Promise<string>,
        [string | Buffer, string | number]
      >;
      hashSpy.mockResolvedValue('new_hashed_pw');

      mock_data_source.transaction.mockImplementation(
        async (cb: (manager: Record<string, unknown>) => Promise<unknown>) => {
          const result = await cb({} as Record<string, unknown>);
          return result;
        },
      );

      const updatedEntity = {
        ...existingSuperadmin,
        ...dto,
        password: 'new_hashed_pw',
      };
      mock_model_action_impl.update.mockResolvedValue(updatedEntity);

      const result = await service.createSuperAdmin(dto);

      expect(model_action.update).toHaveBeenCalled();
      expect(mock_email_service.sendMail).not.toHaveBeenCalled();
      expect(result.message).toBe(sysMsg.SUPERADMIN_ACCOUNT_UPDATED);
      expect(result.status_code).toBe(200);
      expect(result.data.first_name).toBe(dto.first_name);
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
        first_name: 'Test',
        last_name: 'Admin',
        email: loginDto.email,
        school_name: 'The Bells University',
        password: 'hashed_pw',
        reset_token: null,
        reset_token_expiration: null,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        sessions: [],
        role: Role.SUPERADMIN,
      };

      mock_model_action_impl.get.mockResolvedValue(superadminEntity);

      // stub bcrypt.compare
      const compareSpy = jest.spyOn(
        bcrypt,
        'compare',
      ) as unknown as jest.SpyInstance<Promise<boolean>, [string, string]>;
      compareSpy.mockResolvedValue(true);

      mock_jwt_service.signAsync
        .mockResolvedValueOnce('access_token_xyz')
        .mockResolvedValueOnce('refresh_token_xyz');

      const sessionInfo = {
        session_id: 'session-uuid',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
      mock_superadmin_session_service.createSession.mockResolvedValue(
        sessionInfo,
      );

      const result = await service.login(loginDto);

      expect(model_action.get).toHaveBeenCalledWith({
        identifierOptions: { email: loginDto.email },
      });

      expect(compareSpy).toHaveBeenCalledWith(
        loginDto.password,
        superadminEntity.password,
      );

      expect(mock_jwt_service.signAsync).toHaveBeenCalledTimes(2);
      expect(mock_superadmin_session_service.createSession).toHaveBeenCalled();

      expect(result).toHaveProperty('message', sysMsg.LOGIN_SUCCESS);
      expect(result).toHaveProperty('status_code', 200);
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('access_token', 'access_token_xyz');
      expect(result.data).toHaveProperty('refresh_token', 'refresh_token_xyz');
      expect(result.data).toHaveProperty('session_id', 'session-uuid');
      expect(result.data.id).toBe(superadminEntity.id);
      expect(result.data.email).toBe(superadminEntity.email);
    });

    it('should throw UnauthorizedException when superadmin email does not exist', async () => {
      mock_model_action_impl.get.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(model_action.get).toHaveBeenCalledWith({
        identifierOptions: { email: loginDto.email },
      });
    });

    it('should throw UnauthorizedException when superadmin is inactive', async () => {
      const inactiveSuperadmin: SuperAdmin = {
        id: 'uuid-1',
        first_name: 'Test',
        last_name: 'Admin',
        email: loginDto.email,
        school_name: 'The Bells University',
        password: 'hashed_pw',
        reset_token: null,
        reset_token_expiration: null,
        is_active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        sessions: [],
        role: Role.SUPERADMIN,
      };

      mock_model_action_impl.get.mockResolvedValue(inactiveSuperadmin);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const superadminEntity: SuperAdmin = {
        id: 'uuid-1',
        first_name: 'Test',
        last_name: 'Admin',
        email: loginDto.email,
        school_name: 'The Bells University',
        password: 'hashed_pw',
        reset_token: null,
        reset_token_expiration: null,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        sessions: [],
        role: Role.SUPERADMIN,
      };

      mock_model_action_impl.get.mockResolvedValue(superadminEntity);

      // stub bcrypt.compare to return false
      const compareSpy = jest.spyOn(
        bcrypt,
        'compare',
      ) as unknown as jest.SpyInstance<Promise<boolean>, [string, string]>;
      compareSpy.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(compareSpy).toHaveBeenCalledWith(
        loginDto.password,
        superadminEntity.password,
      );
    });

    it('should log success message after successful login', async () => {
      const superadminEntity: SuperAdmin = {
        id: 'uuid-1',
        first_name: 'Test',
        last_name: 'Admin',
        email: loginDto.email,
        school_name: 'The Bells University',
        password: 'hashed_pw',
        reset_token: null,
        reset_token_expiration: null,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        sessions: [],
        role: Role.SUPERADMIN,
      };

      mock_model_action_impl.get.mockResolvedValue(superadminEntity);

      const compareSpy = jest.spyOn(
        bcrypt,
        'compare',
      ) as unknown as jest.SpyInstance<Promise<boolean>, [string, string]>;
      compareSpy.mockResolvedValue(true);

      mock_jwt_service.signAsync
        .mockResolvedValueOnce('access_token_xyz')
        .mockResolvedValueOnce('refresh_token_xyz');

      mock_superadmin_session_service.createSession.mockResolvedValue({
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

      mock_superadmin_session_service.revokeSession.mockResolvedValue(
        undefined,
      );

      const result = await service.logout(logoutDto);

      expect(
        mock_superadmin_session_service.revokeSession,
      ).toHaveBeenCalledWith(logoutDto.session_id, logoutDto.user_id);
      expect(mockLogger.info).toHaveBeenCalledWith(sysMsg.LOGOUT_SUCCESS);
      expect(result).toEqual({
        status_code: 200,
        message: sysMsg.LOGOUT_SUCCESS,
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
              useValue: mock_model_action_impl,
            },
            {
              provide: DataSource,
              useValue: mock_data_source,
            },
            {
              provide: JwtService,
              useValue: mock_jwt_service,
            },
            {
              provide: SuperadminSessionService,
              useValue: null,
            },
            {
              provide: EmailService,
              useValue: mock_email_service,
            },
            {
              provide: ConfigService,
              useValue: mock_config_service,
            },
          ],
        }).compile();

      const serviceWithoutSession =
        moduleWithoutSession.get<SuperadminService>(SuperadminService);

      const result = await serviceWithoutSession.logout(
        logoutDto as unknown as LogoutDto,
      );

      expect(result).toEqual({
        message: sysMsg.LOGOUT_SUCCESS,
        status_code: 200,
      });
      expect(mockLogger.info).toHaveBeenCalledWith(sysMsg.LOGOUT_SUCCESS);
    });

    it('should pass correct parameters to revoke session', async () => {
      const logoutDto: LogoutDto = {
        user_id: 'different-user-id',
        session_id: 'different-session-id',
      };

      mock_superadmin_session_service.revokeSession.mockResolvedValue(
        undefined,
      );

      await service.logout(logoutDto);

      expect(
        mock_superadmin_session_service.revokeSession,
      ).toHaveBeenCalledWith('different-session-id', 'different-user-id');
      expect(
        mock_superadmin_session_service.revokeSession,
      ).toHaveBeenCalledTimes(1);
    });

    it('should log success message after logout', async () => {
      const logoutDto: LogoutDto = {
        user_id: 'user-id-123',
        session_id: 'session-id-456',
      };

      mock_superadmin_session_service.revokeSession.mockResolvedValue(
        undefined,
      );

      await service.logout(logoutDto);

      expect(mockLogger.info).toHaveBeenCalledWith(sysMsg.LOGOUT_SUCCESS);
    });

    it('should handle session revoke errors gracefully', async () => {
      const logoutDto: LogoutDto = {
        user_id: 'user-id-123',
        session_id: 'session-id-456',
      };

      const error = new Error('Session revocation failed');
      mock_superadmin_session_service.revokeSession.mockRejectedValue(error);

      await expect(service.logout(logoutDto)).rejects.toThrow(
        'Session revocation failed',
      );
      expect(
        mock_superadmin_session_service.revokeSession,
      ).toHaveBeenCalledWith(logoutDto.session_id, logoutDto.user_id);
    });
  });
});
