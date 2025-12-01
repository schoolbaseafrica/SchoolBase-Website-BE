import {
  Controller,
  Get,
  UseGuards,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../shared/enums';

import { ApiLoadStudentDashboard } from './docs/student-dashboard.swagger';
import { StudentDashboardDataDto } from './dto/student-dashboard-response.dto';
import { StudentDashboardService } from './student-dashboard.service';

@Controller('dashboard/student')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Dashboard')
@ApiBearerAuth()
export class StudentDashboardController {
  constructor(
    private readonly studentDashboardService: StudentDashboardService,
  ) {}

  @Get('load')
  @Roles(UserRole.STUDENT)
  @ApiLoadStudentDashboard()
  async loadDashboard(@Request() req): Promise<{
    message: string;
    status_code: number;
    data: StudentDashboardDataDto;
  }> {
    const userId: string = req.user?.id || req.user?.userId;

    const data =
      await this.studentDashboardService.loadStudentDashboard(userId);

    return {
      message: 'Student dashboard loaded successfully',
      status_code: HttpStatus.OK,
      data,
    };
  }
}
