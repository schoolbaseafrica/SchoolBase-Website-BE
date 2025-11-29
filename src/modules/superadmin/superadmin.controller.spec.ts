import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import * as sysMsg from '../../constants/system.messages';

import { CreateSuperadminDto } from './dto/create-superadmin.dto';
import { LoginSuperadminDto } from './dto/login-superadmin.dto';
import { LogoutDto } from './dto/superadmin-logout.dto';
import { Role } from './entities/superadmin.entity';
import { SuperadminController } from './superadmin.controller';
import { SuperadminService } from './superadmin.service';

describe('SuperadminController', () => {
  let controller: SuperadminController;
  let service: jest.Mocked<Partial<SuperadminService>>;

  const mockService = {
    createSuperAdmin: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuperadminController],
      providers: [
        {
          provide: SuperadminService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<SuperadminController>(SuperadminController);
    service = module.get(SuperadminService) as unknown;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // tests for create endpoint
  describe('create', () => {
    const dto: CreateSuperadminDto = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      password: 'pass1234',
      confirm_password: 'pass1234',
      school_name: 'The Bells University',
      role: Role.SUPERADMIN,
    } as unknown as CreateSuperadminDto;

    it('should call service.createSuperAdmin and return its result', async () => {
      const serviceResult = {
        message: sysMsg.SUPERADMIN_ACCOUNT_CREATED,
        status_code: 201,
        data: { id: 'uuid-1', email: dto.email },
      };

      mockService.createSuperAdmin.mockResolvedValue(serviceResult);

      const result = await controller.create(dto);

      expect(service.createSuperAdmin).toHaveBeenCalledWith(dto);
      expect(result).toEqual(serviceResult);
    });

    it('should assign SUPERADMIN role when creating a superadmin', async () => {
      const serviceResult = {
        message: sysMsg.SUPERADMIN_ACCOUNT_CREATED,
        status_code: 201,
        data: { id: 'uuid-1', email: dto.email, role: Role.SUPERADMIN },
      };
      mockService.createSuperAdmin.mockResolvedValue(serviceResult);
      await controller.create(dto);
      expect(service.createSuperAdmin).toHaveBeenCalledWith(
        expect.objectContaining({ role: Role.SUPERADMIN }),
      );
    });

    it('should propagate UnauthorizedException when a superadmin already exists', async () => {
      mockService.createSuperAdmin.mockRejectedValue(
        new UnauthorizedException(sysMsg.SUPERADMIN_ALREADY_EXISTS),
      );

      await expect(controller.create(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // tests for login endpoint
  describe('login', () => {
    const loginDto: LoginSuperadminDto = {
      email: 'admin@example.com',
      password: 'password123',
    };

    it('should call service.login and return its result', async () => {
      const serviceResult = {
        message: sysMsg.LOGIN_SUCCESS,
        status_code: 200,
        data: {
          id: 'uuid-1',
          email: loginDto.email,
          access_token: 'access_token_xyz',
          refresh_token: 'refresh_token_xyz',
          session_id: 'session-uuid',
        },
      };

      mockService.login.mockResolvedValue(serviceResult);

      const result = await controller.login(loginDto);

      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(serviceResult);
    });

    it('should propagate UnauthorizedException when email does not exist', async () => {
      mockService.login.mockRejectedValue(
        new UnauthorizedException('Superadmin not found'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should propagate UnauthorizedException when password is invalid', async () => {
      mockService.login.mockRejectedValue(
        new UnauthorizedException('Invalid password'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should propagate UnauthorizedException when superadmin is inactive', async () => {
      mockService.login.mockRejectedValue(
        new UnauthorizedException('Superadmin account is inactive'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // tests for logout endpoint
  describe('logout', () => {
    const logoutDto = {
      user_id: 'user-id-123',
      session_id: 'session-id-456',
    };

    it('should call service.logout and return its result', async () => {
      const serviceResult = {
        message: sysMsg.LOGOUT_SUCCESS,
      };

      // lazily add logout mock to the mocked service (typed via unknown)
      type SvcWithLogout = jest.Mocked<Partial<SuperadminService>> & {
        logout: jest.Mock;
      };
      const svc = mockService as unknown as SvcWithLogout;
      svc.logout = jest.fn().mockResolvedValue(serviceResult);

      const result = await controller.logout(logoutDto as unknown as LogoutDto);

      expect(svc.logout).toHaveBeenCalledWith(logoutDto);
      expect(result).toEqual(serviceResult);
    });

    it('should propagate errors from the service', async () => {
      const svc = mockService as unknown as {
        logout: jest.Mock;
      };
      svc.logout = jest.fn().mockRejectedValue(new ConflictException('boom'));

      await expect(
        controller.logout(logoutDto as unknown as LogoutDto),
      ).rejects.toThrow(ConflictException);
    });
  });
});
