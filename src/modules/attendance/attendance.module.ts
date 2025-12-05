import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AcademicSessionModule } from '../academic-session/academic-session.module';
import { TermModule } from '../academic-term/term.module';
import { TeachersModule } from '../teacher/teacher.module';

import {
  ScheduleBasedAttendanceController,
  StudentDailyAttendanceController,
  TeacherManualCheckinController,
} from './controllers';
import {
  ScheduleBasedAttendance,
  StudentDailyAttendance,
  TeacherDailyAttendance,
  TeacherManualCheckin,
} from './entities';
import {
  AttendanceModelAction,
  StudentDailyAttendanceModelAction,
  TeacherManualCheckinModelAction,
} from './model-actions';
import { TeacherDailyAttendanceModelAction } from './model-actions/teacher-daily-attendance.action';
import { AttendanceService, TeacherManualCheckinService } from './services';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ScheduleBasedAttendance,
      StudentDailyAttendance,
      TeacherManualCheckin,
      TeacherDailyAttendance,
    ]),
    AcademicSessionModule,
    TermModule,
    TeachersModule,
  ],
  controllers: [
    ScheduleBasedAttendanceController,
    StudentDailyAttendanceController,
    TeacherManualCheckinController,
  ],
  providers: [
    AttendanceService,
    TeacherManualCheckinService,
    AttendanceModelAction,
    StudentDailyAttendanceModelAction,
    TeacherManualCheckinModelAction,
    TeacherDailyAttendanceModelAction,
  ],
  exports: [AttendanceService, TeacherManualCheckinService],
})
export class AttendanceModule {}
