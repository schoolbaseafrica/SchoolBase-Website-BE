import { Controller, Post, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import {
  TwoFactorAuthService,
  IEnable2faResponse,
} from './two-factor-auth.service';

@ApiTags('2FA')
@Controller('auth/2fa')
export class TwoFactorAuthController {
  constructor(private readonly twoFactorAuthService: TwoFactorAuthService) {}

  @Post('enable/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable two-factor authentication' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns secret, QR code, and backup codes',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async enable2fa(
    @Param('userId') userId: string,
  ): Promise<IEnable2faResponse> {
    return this.twoFactorAuthService.enable2fa(userId);
  }
}
