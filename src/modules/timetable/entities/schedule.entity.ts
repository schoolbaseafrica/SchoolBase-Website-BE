import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { Subject } from '../../subject/entities/subject.entity';
import { Teacher } from '../../teacher/entities/teacher.entity';
import { DayOfWeek, PeriodType } from '../enums/timetable.enums';

import { Timetable } from './timetable.entity';

@Entity({ name: 'schedules' })
export class Schedule extends BaseEntity {
  @Column({
    type: 'enum',
    enum: DayOfWeek,
  })
  day: DayOfWeek;

  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;

  @Column({
    type: 'enum',
    enum: PeriodType,
    default: PeriodType.ACADEMICS,
  })
  period_type: PeriodType;

  @Column({ nullable: true })
  room: string;

  @ManyToOne(() => Timetable, (timetable) => timetable.schedules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'timetable_id' })
  timetable: Timetable;

  @Column({ name: 'timetable_id' })
  timetable_id: string;

  @ManyToOne(() => Subject, { nullable: true })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ name: 'subject_id', nullable: true })
  subject_id: string;

  @ManyToOne(() => Teacher, { nullable: true })
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

  @Column({ name: 'teacher_id', nullable: true })
  teacher_id: string;
}
