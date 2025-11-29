import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

import { ApiSuccessResponseDto } from '../../common/dto/response.dto';
import * as sysMsg from '../../constants/system.messages';

import { CreateSuperadminDto } from './dto/create-superadmin.dto';
import { LoginSuperadminDto } from './dto/login-superadmin.dto';
import { LogoutDto } from './dto/superadmin-logout.dto';
import { SuperadminService } from './superadmin.service';

@Controller('superadmin')
export class SuperadminController {
  constructor(private readonly superadminService: SuperadminService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new superadmin' })
  @ApiResponse({
    status: 201,
    description: sysMsg.SUPERADMIN_ACCOUNT_CREATED,
    type: ApiSuccessResponseDto,
  })
  async create(@Body() createSuperadminDto: CreateSuperadminDto) {
    return this.superadminService.createSuperAdmin(createSuperadminDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: sysMsg.LOGIN_SUCCESS })
  @ApiResponse({
    status: 200,
    description: sysMsg.LOGIN_SUCCESS,
    type: ApiSuccessResponseDto,
  })
  async login(@Body() loginSuperadminDto: LoginSuperadminDto) {
    return this.superadminService.login(loginSuperadminDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: sysMsg.LOGOUT_SUCCESS })
  @ApiResponse({
    status: 200,
    description: sysMsg.LOGOUT_SUCCESS,
    type: ApiSuccessResponseDto,
  })
  async logout(@Body() logoutDto: LogoutDto) {
    return this.superadminService.logout(logoutDto);
  }
}
