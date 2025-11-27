import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { Class } from '../../class/entities/class.entity';
import { Subject } from '../../subject/entities/subject.entity';
import { Teacher } from '../../teacher/entities/teacher.entity';
import { DayOfWeek, PeriodType } from '../enums/timetable.enums';

@Entity({ name: 'timetables' })
export class Timetable extends BaseEntity {
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
    default: PeriodType.LESSON,
  })
  period_type: PeriodType;

  @ManyToOne(() => Class, { nullable: false })
  @JoinColumn({ name: 'class_id' })
  stream: Class;

  @Column({ name: 'class_id' })
  stream_id: string;

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

  @Column({ nullable: true })
  room: string;

  @Column({ type: 'date' })
  effective_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;
}
