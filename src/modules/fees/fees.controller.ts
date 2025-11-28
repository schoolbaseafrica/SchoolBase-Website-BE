import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';

import * as sysMsg from '../../constants/system.messages';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../shared/enums';

import { swaggerCreateFee } from './docs/fees.swagger';
import { CreateFeesDto } from './dto/fees.dto';
import { FeesService } from './fees.service';

@Controller('fees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @swaggerCreateFee()
  async createFee(
    @Body() createFeesDto: CreateFeesDto,
    @Request() req: { user: { userId: string } },
  ) {
    const fee = await this.feesService.create(createFeesDto, req.user.userId);
    return {
      message: sysMsg.FEE_CREATED_SUCCESSFULLY,
      fee,
    };
  }
}
