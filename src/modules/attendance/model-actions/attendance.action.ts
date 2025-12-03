import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ScheduleBasedAttendance } from '../entities';

@Injectable()
export class AttendanceModelAction extends AbstractModelAction<ScheduleBasedAttendance> {
  constructor(
    @InjectRepository(ScheduleBasedAttendance)
    attendanceRepository: Repository<ScheduleBasedAttendance>,
  ) {
    super(attendanceRepository, ScheduleBasedAttendance);
  }
}
