import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Schedule } from '../entities/schedule.entity';
import { DayOfWeek } from '../enums/timetable.enums';

@Injectable()
export class ScheduleModelAction extends AbstractModelAction<Schedule> {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
  ) {
    super(scheduleRepository, Schedule);
  }

  async findClassSchedules(
    classId: string,
    day: DayOfWeek,
    isActive: boolean = true,
  ): Promise<Schedule[]> {
    return this.scheduleRepository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.timetable', 'timetable')
      .where('timetable.class_id = :classId', { classId })
      .andWhere('schedule.day = :day', { day })
      .andWhere('timetable.is_active = :isActive', { isActive })
      .getMany();
  }

  async findTeacherSchedules(
    teacherId: string,
    day: DayOfWeek,
    isActive: boolean = true,
  ): Promise<Schedule[]> {
    return this.scheduleRepository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.timetable', 'timetable')
      .where('schedule.teacher_id = :teacherId', { teacherId })
      .andWhere('schedule.day = :day', { day })
      .andWhere('timetable.is_active = :isActive', { isActive })
      .getMany();
  }

  async getScheduleWithTimetable(scheduleId: string): Promise<Schedule> {
    return this.scheduleRepository.findOne({
      where: { id: scheduleId },
      relations: ['timetable'],
    });
  }
}
