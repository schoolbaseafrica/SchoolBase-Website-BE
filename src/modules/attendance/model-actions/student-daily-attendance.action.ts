import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { StudentDailyAttendance } from '../entities';

@Injectable()
export class StudentDailyAttendanceModelAction extends AbstractModelAction<StudentDailyAttendance> {
  constructor(
    @InjectRepository(StudentDailyAttendance)
    studentDailyAttendanceRepository: Repository<StudentDailyAttendance>,
  ) {
    super(studentDailyAttendanceRepository, StudentDailyAttendance);
  }
}
