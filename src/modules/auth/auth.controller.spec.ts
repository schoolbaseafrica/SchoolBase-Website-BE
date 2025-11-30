import {
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import * as sysMsg from '../../constants/system.messages';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    activateUserAccount: jest.fn(),
    getProfile: jest.fn(),
    logout: jest.fn(),
    googleLogin: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('activateAccount', () => {
    it('should activate a user account and return a success message', async () => {
      const userId = 'some-uuid';
      const successMessage = sysMsg.USER_ACTIVATED;

      mockAuthService.activateUserAccount.mockResolvedValue(successMessage);

      const result = await controller.activateAccount(userId);

      expect(authService.activateUserAccount).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        status: HttpStatus.OK,
        message: successMessage,
      });
    });

    it('should return a message indicating the user is already active', async () => {
      const userId = 'some-uuid';
      const successMessage = sysMsg.USER_IS_ACTIVATED;

      mockAuthService.activateUserAccount.mockResolvedValue(successMessage);

      const result = await controller.activateAccount(userId);

      expect(authService.activateUserAccount).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        status: HttpStatus.OK,
        message: successMessage,
      });
    });

    it('should throw a NotFoundException if user does not exist', async () => {
      const userId = 'non-existent-uuid';

      mockAuthService.activateUserAccount.mockRejectedValue(
        new NotFoundException(sysMsg.USER_NOT_FOUND),
      );

      await expect(controller.activateAccount(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.activateAccount(userId)).rejects.toThrow(
        sysMsg.USER_NOT_FOUND,
      );
    });
  });

  describe('getProfile', () => {
    const mockAuthorization = 'Bearer mock-access-token';

    it('should successfully return user profile', async () => {
      const mockUserProfile = {
        id: 'user-id-123',
        email: 'john.doe@example.com',
        first_name: 'John',
        last_name: 'Doe',
        middle_name: 'Michael',
        role: ['STUDENT'],
        gender: 'Male',
        dob: '2000-01-15',
        phone: '+1234567890',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockAuthService.getProfile.mockResolvedValue(mockUserProfile);

      const result = await controller.getProfile(mockAuthorization);

      expect(authService.getProfile).toHaveBeenCalledWith(mockAuthorization);
      expect(result).toEqual(mockUserProfile);
      expect(result.id).toBeDefined();
      expect(result.email).toBeDefined();
      expect(result.first_name).toBeDefined();
      expect(result.last_name).toBeDefined();
    });

    it('should throw UnauthorizedException when authorization header is missing', async () => {
      mockAuthService.getProfile.mockRejectedValue(
        new UnauthorizedException(sysMsg.AUTHORIZATION_HEADER_MISSING),
      );

      await expect(controller.getProfile('')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authService.getProfile).toHaveBeenCalledWith('');
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      mockAuthService.getProfile.mockRejectedValue(
        new UnauthorizedException(
          `${sysMsg.TOKEN_INVALID} or ${sysMsg.TOKEN_EXPIRED}`,
        ),
      );

      await expect(
        controller.getProfile('Bearer invalid-token'),
      ).rejects.toThrow(UnauthorizedException);
      expect(authService.getProfile).toHaveBeenCalledWith(
        'Bearer invalid-token',
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockAuthService.getProfile.mockRejectedValue(
        new UnauthorizedException(sysMsg.USER_NOT_FOUND),
      );

      await expect(controller.getProfile(mockAuthorization)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.getProfile(mockAuthorization)).rejects.toThrow(
        sysMsg.USER_NOT_FOUND,
      );
      expect(authService.getProfile).toHaveBeenCalledWith(mockAuthorization);
    });
  });

  describe('logout', () => {
    it('should successfully logout user and return success message', async () => {
      const logoutDto = {
        user_id: 'user-id-123',
        session_id: 'session-id-456',
      };
      const successResponse = {
        message: sysMsg.LOGOUT_SUCCESS,
      };

      mockAuthService.logout.mockResolvedValue(successResponse);

      const result = await controller.logout(logoutDto);

      expect(authService.logout).toHaveBeenCalledWith(logoutDto);
      expect(result).toEqual(successResponse);
      expect(result.message).toEqual(sysMsg.LOGOUT_SUCCESS);
    });

    it('should pass correct user_id and session_id to service', async () => {
      const logoutDto = {
        user_id: 'different-user-id',
        session_id: 'different-session-id',
      };

      mockAuthService.logout.mockResolvedValue({
        message: sysMsg.LOGOUT_SUCCESS,
      });

      await controller.logout(logoutDto);

      expect(authService.logout).toHaveBeenCalledWith(logoutDto);
      expect(authService.logout).toHaveBeenCalledTimes(1);
    });
  });
  describe('googleLogin', () => {
    it('should successfully login with google token', async () => {
      const googleLoginDto = {
        token: 'valid-google-token',
      };
      const expectedResult = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        message: 'Login successful',
      };

      mockAuthService.googleLogin.mockResolvedValue(expectedResult);

      const result = await controller.googleLogin(googleLoginDto);

      expect(authService.googleLogin).toHaveBeenCalledWith(
        googleLoginDto.token,
        undefined,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should successfully login with google token and invite token', async () => {
      const googleLoginDto = {
        token: 'valid-google-token',
        invite_token: 'valid-invite-token',
      };
      const expectedResult = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        message: 'Login successful',
      };

      mockAuthService.googleLogin.mockResolvedValue(expectedResult);

      const result = await controller.googleLogin(googleLoginDto);

      expect(authService.googleLogin).toHaveBeenCalledWith(
        googleLoginDto.token,
        googleLoginDto.invite_token,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should throw UnauthorizedException if service throws', async () => {
      const googleLoginDto = {
        token: 'invalid-token',
      };

      mockAuthService.googleLogin.mockRejectedValue(
        new UnauthorizedException(sysMsg.INVALID_GOOGLE_TOKEN),
      );

      await expect(controller.googleLogin(googleLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
