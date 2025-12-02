import {
  Controller,
  Get,
  UseGuards,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import * as sysMsg from '../../../constants/system.messages';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../shared/enums';
import { TeacherModelAction } from '../../teacher/model-actions/teacher-actions';

import { ApiGetTodaysClasses } from './docs/teacher-dashboard.swagger';
import { TodaysClassesResponseDto } from './dto/teacher-dashboard-response.dto';
import { TeacherDashboardService } from './teacher-dashboard.service';

@Controller('dashboard/teacher')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Dashboard')
@ApiBearerAuth()
export class TeacherDashboardController {
  constructor(
    private readonly teacherDashboardService: TeacherDashboardService,
    private readonly teacherModelAction: TeacherModelAction,
  ) {}

  @Get('today-classes')
  @Roles(UserRole.TEACHER)
  @ApiGetTodaysClasses()
  async getTodaysClasses(@CurrentUser() user: { id: string }): Promise<{
    message: string;
    status_code: number;
    data: TodaysClassesResponseDto;
  }> {
    const userId = user.id;
    console.log('Debug: userId from token:', userId);

    // Get teacher record from user_id
    const teacher = await this.teacherModelAction.get({
      identifierOptions: { user_id: userId },
    });
    console.log('Debug: teacher record found:', teacher ? teacher.id : 'null');

    if (!teacher) {
      throw new NotFoundException(sysMsg.TEACHER_PROFILE_NOT_FOUND);
    }

    const data = await this.teacherDashboardService.getTodaysClasses(
      teacher.id,
    );

    return {
      message:
        data.total_classes > 0
          ? sysMsg.TODAYS_CLASSES_FETCHED
          : sysMsg.NO_CLASSES_TODAY,
      status_code: HttpStatus.OK,
      data,
    };
  }
}
