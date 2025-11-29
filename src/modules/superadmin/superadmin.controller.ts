import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';

import {
  ApiCreateSuperadmin,
  ApiLoginSuperadmin,
  ApiLogoutSuperadmin,
} from './docs/superadmin.swagger';
import { CreateSuperadminDto } from './dto/create-superadmin.dto';
import { LoginSuperadminDto } from './dto/login-superadmin.dto';
import { LogoutDto } from './dto/superadmin-logout.dto';
import { SuperadminService } from './superadmin.service';

@UseGuards(RateLimitGuard)
@RateLimit({ maxRequests: 3, windowMs: 15 * 60 * 1000 })
@Controller('superadmin')
export class SuperadminController {
  constructor(private readonly superadminService: SuperadminService) {}

  @Post()
  @ApiCreateSuperadmin()
  async create(@Body() createSuperadminDto: CreateSuperadminDto) {
    return this.superadminService.createSuperAdmin(createSuperadminDto);
  }

  @Post('login')
  @ApiLoginSuperadmin()
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginSuperadminDto: LoginSuperadminDto) {
    return this.superadminService.login(loginSuperadminDto);
  }

  @Post('logout')
  @ApiLogoutSuperadmin()
  @HttpCode(HttpStatus.OK)
  async logout(@Body() logoutDto: LogoutDto) {
    return this.superadminService.logout(logoutDto);
  }
}
