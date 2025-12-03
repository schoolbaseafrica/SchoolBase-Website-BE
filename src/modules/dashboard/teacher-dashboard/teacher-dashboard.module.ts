import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Teacher } from '../../teacher/entities/teacher.entity';
import { TeacherModelAction } from '../../teacher/model-actions/teacher-actions';
import { Schedule } from '../../timetable/entities/schedule.entity';
import { ScheduleModelAction } from '../../timetable/model-actions/schedule.model-action';

import { TeacherDashboardController } from './teacher-dashboard.controller';
import { TeacherDashboardService } from './teacher-dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([Schedule, Teacher])],
  controllers: [TeacherDashboardController],
  providers: [TeacherDashboardService, ScheduleModelAction, TeacherModelAction],
  exports: [TeacherDashboardService],
})
export class TeacherDashboardModule {}
