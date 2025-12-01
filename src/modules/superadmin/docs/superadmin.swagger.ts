import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

import * as sysMsg from '../../../constants/system.messages';
import { SuperadminCreateResponseDto } from '../dto/create-superadmin-response.dto';
import { SuperadminLoginResponseDto } from '../dto/login-superadmin-response.dto';
import { SuperadminLogoutResponseDto } from '../dto/logout-superadmin-response.dto';

export const ApiCreateSuperadmin = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new superadmin' }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: sysMsg.SUPERADMIN_ACCOUNT_CREATED,
      type: SuperadminCreateResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: sysMsg.SUPERADMIN_ALREADY_EXISTS,
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: sysMsg.SUPERADMIN_PASSWORDS_REQUIRED,
    }),
    ApiResponse({
      status: HttpStatus.TOO_MANY_REQUESTS,
      description: sysMsg.TOO_MANY_REQUESTS,
    }),
  );
};

export const ApiLoginSuperadmin = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Log in as a superadmin' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: sysMsg.LOGIN_SUCCESS,
      type: SuperadminLoginResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: sysMsg.INVALID_CREDENTIALS,
      examples: {
        invalid_credentials: {
          summary: 'invalid credentials',
          value: {
            status_code: HttpStatus.UNAUTHORIZED,
            message: sysMsg.INVALID_CREDENTIALS,
          },
        },
        user_inactive: {
          summary: 'superadmin account inactive',
          value: {
            status_code: HttpStatus.UNAUTHORIZED,
            message: sysMsg.USER_INACTIVE,
          },
        },
        invalid_password: {
          summary: 'invalid password',
          value: {
            status_code: HttpStatus.UNAUTHORIZED,
            message: sysMsg.SUPERADMIN_INVALID_PASSWORD,
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.TOO_MANY_REQUESTS,
      description: sysMsg.TOO_MANY_REQUESTS,
    }),
  );
};

export const ApiLogoutSuperadmin = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Log out as a superadmin' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: sysMsg.LOGOUT_SUCCESS,
      type: SuperadminLogoutResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.TOO_MANY_REQUESTS,
      description: sysMsg.TOO_MANY_REQUESTS,
    }),
  );
};
