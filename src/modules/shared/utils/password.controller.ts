import {
  Controller,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { Public } from '../../../common/decorators/public.decorator';
import { RateLimit } from '../../../common/decorators/rate-limit.decorator';
import { RateLimitGuard } from '../../../common/guards/rate-limit.guard';

import { GeneratePasswordResponseDto } from './generate-password-response.dto';
import { PasswordService } from './password.service';

@Controller('generate-password')
@ApiTags('Utilities')
export class PasswordController {
  constructor(private readonly passwordService: PasswordService) {}

  @Get()
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ maxRequests: 10, windowMs: 60000 })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate a strong password (Public endpoint, rate limited)',
    description:
      'This is a public endpoint that generates secure passwords. Rate limited to 10 requests per minute per IP address.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password generated successfully',
    type: GeneratePasswordResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Please try again later.',
  })
  async generatePassword(): Promise<GeneratePasswordResponseDto> {
    return this.passwordService.generatePassword();
  }
}
