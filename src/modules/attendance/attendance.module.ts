import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AcademicSessionModule } from '../academic-session/academic-session.module';
import { TermModule } from '../academic-term/term.module';

import { ScheduleBasedAttendanceController } from './controllers/schedule-based-attendance.controller';
import { StudentDailyAttendanceController } from './controllers/student-daily-attendance.controller';
import { ScheduleBasedAttendance, StudentDailyAttendance } from './entities';
import {
  AttendanceModelAction,
  StudentDailyAttendanceModelAction,
} from './model-actions';
import { AttendanceService } from './services/attendance.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScheduleBasedAttendance, StudentDailyAttendance]),
    AcademicSessionModule,
    TermModule,
  ],
  controllers: [
    ScheduleBasedAttendanceController,
    StudentDailyAttendanceController,
  ],
  providers: [
    AttendanceService,
    AttendanceModelAction,
    StudentDailyAttendanceModelAction,
  ],
  exports: [AttendanceService],
})
export class AttendanceModule {}
