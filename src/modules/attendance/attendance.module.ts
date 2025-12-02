import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AcademicSessionModule } from '../academic-session/academic-session.module';

import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { Attendance } from './entities';
import { AttendanceModelAction } from './model-actions';

@Module({
  imports: [TypeOrmModule.forFeature([Attendance]), AcademicSessionModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceModelAction],
  exports: [AttendanceModelAction, AttendanceService],
})
export class AttendanceModule {}
