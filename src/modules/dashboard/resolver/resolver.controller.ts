import {
  Controller,
  Get,
  UseGuards,
  HttpStatus,
  Request,
} from '@nestjs/common';

import * as sysMsg from '../../../constants/system.messages';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../shared/enums';

import {
  ApiDashboardTags,
  ApiDashboardBearerAuth,
  ApiResolveDashboard,
} from './docs/dashboard-resolve.swagger';
import { DashboardResolvedDataDto } from './dto/dashboard-resolver-response.dto';
import { ResolverService } from './resolver.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiDashboardTags()
@ApiDashboardBearerAuth()
export class ResolverController {
  constructor(private readonly resolverService: ResolverService) {}

  @Get('resolve')
  @ApiResolveDashboard()
  async resolveDashboard(@Request() req): Promise<{
    message: string;
    status_code: number;
    data: DashboardResolvedDataDto;
  }> {
    const userId: string = req.user?.id || req.user?.userId;
    const tokenRole: UserRole[] = req.user?.roles;

    const data = await this.resolverService.resolveDashboard(userId, tokenRole);

    return {
      message: sysMsg.DASHBOARD_RESOLVED,
      status_code: HttpStatus.OK,
      data,
    };
  }
}
