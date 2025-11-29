import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  Patch,
  Param,
} from '@nestjs/common';

import * as sysMsg from '../../constants/system.messages';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../shared/enums';

import {
  swaggerGetAllFees,
  swaggerCreateFee,
  swaggerDeactivateFee,
  swaggerUpdateFee,
} from './docs/fees.swagger';
import { DeactivateFeeDto } from './dto/deactivate-fee.dto';
import { CreateFeesDto, QueryFeesDto, UpdateFeesDto } from './dto/fees.dto';
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
      ...result,
    };
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN)
  @swaggerDeactivateFee()
  async deactivateFee(
    @Param('id') id: string,
    @Body() deactivateFeeDto: DeactivateFeeDto,
    @Request() req: { user: { userId: string } },
  ) {
    const fee = await this.feesService.deactivate(
      id,
      req.user.userId,
      deactivateFeeDto.reason,
    );
    return {
      message: sysMsg.FEE_DEACTIVATED_SUCCESSFULLY,
      data: fee,
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @swaggerUpdateFee()
  async updateFee(
    @Param('id') id: string,
    @Body() updateFeesDto: UpdateFeesDto,
  ) {
    const fee = await this.feesService.update(id, updateFeesDto);
    return {
      message: sysMsg.FEE_UPDATED_SUCCESSFULLY,
      fee,
    };
  }
}
