import { Module } from '@nestjs/common';

import { RateLimitGuard } from '../../../common/guards/rate-limit.guard';

import { PasswordController } from './password.controller';
import { PasswordService } from './password.service';

@Module({
  controllers: [PasswordController],
  providers: [PasswordService, RateLimitGuard],
  exports: [PasswordService],
})
export class UtilsModule {}
