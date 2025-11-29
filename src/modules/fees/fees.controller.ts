import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';

import * as sysMsg from '../../constants/system.messages';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../shared/enums';

import { swaggerCreateFee, swaggerGetAllFees } from './docs/fees.swagger';
import { CreateFeesDto, QueryFeesDto } from './dto/fees.dto';
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

  @Get()
  @swaggerGetAllFees()
  async getAllFees(@Query() queryDto: QueryFeesDto) {
    const result = await this.feesService.findAll(queryDto);
    return {
      message: sysMsg.FEES_RETRIEVED_SUCCESSFULLY,
      fees: result.fees,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
