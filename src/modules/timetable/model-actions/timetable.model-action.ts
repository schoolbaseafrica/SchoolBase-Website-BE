import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Timetable } from '../entities/timetable.entity';

@Injectable()
export class TimetableModelAction extends AbstractModelAction<Timetable> {
  constructor(
    @InjectRepository(Timetable)
    timetableRepository: Repository<Timetable>,
  ) {
    super(timetableRepository, Timetable);
  }
  async findTimetableByClassId(classId: string): Promise<Timetable | null> {
    return this.repository
      .createQueryBuilder('timetable')
      .leftJoinAndSelect('timetable.schedules', 'schedule')
      .leftJoinAndSelect('schedule.subject', 'subject')
      .leftJoinAndSelect('schedule.teacher', 'teacher')
      .leftJoinAndSelect('teacher.user', 'user')
      .leftJoinAndSelect('schedule.room', 'room')
      .where('timetable.class_id = :classId', { classId })
      .select([
        'timetable.class_id',
        'schedule.id',
        'schedule.day',
        'schedule.start_time',
        'schedule.end_time',
        'schedule.period_type',
        'subject.id',
        'subject.name',
        'teacher.id',
        'teacher.title',
        'user.first_name',
        'user.last_name',
        'room.id',
        'room.name',
        'room.capacity',
      ])
      .getOne();
  }
}
