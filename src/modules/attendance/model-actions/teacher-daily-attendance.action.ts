import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TeacherDailyAttendance } from '../entities';

@Injectable()
export class TeacherDailyAttendanceModelAction extends AbstractModelAction<TeacherDailyAttendance> {
  constructor(
    @InjectRepository(TeacherDailyAttendance)
    teacherDailyAttendanceRepository: Repository<TeacherDailyAttendance>,
  ) {
    super(teacherDailyAttendanceRepository, TeacherDailyAttendance);
  }
}
