import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Attendance } from '../entities';

@Injectable()
export class AttendanceModelAction extends AbstractModelAction<Attendance> {
  constructor(
    @InjectRepository(Attendance)
    attendanceRepository: Repository<Attendance>,
  ) {
    super(attendanceRepository, Attendance);
  }
}
