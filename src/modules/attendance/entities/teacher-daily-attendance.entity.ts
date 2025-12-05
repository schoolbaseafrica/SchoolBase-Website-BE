import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';

import { Teacher } from 'src/modules/teacher/entities/teacher.entity';
import { User } from 'src/modules/user/entities/user.entity';

import { BaseEntity } from '../../../entities/base-entity';
import {
  TeacherDailyAttendanceSourceEnum,
  TeacherDailyAttendanceStatusEnum,
} from '../enums';

@Entity('teacher_daily_attendance')
@Index(['teacher_id', 'date'], { unique: true })
@Index(['teacher_id'])
@Index(['date'])
export class TeacherDailyAttendance extends BaseEntity {
  @Column({ name: 'teacher_id', type: 'uuid' })
  teacher_id: string;

  @Column({ name: 'date', type: 'date' })
  date: Date;

  @Column({ name: 'check_in_time', type: 'timestamp' })
  check_in_time: Date;

  @Column({
    name: 'status',
    type: 'enum',
    enum: TeacherDailyAttendanceStatusEnum,
    default: TeacherDailyAttendanceStatusEnum.ABSENT,
  })
  status: TeacherDailyAttendanceStatusEnum;

  @Column({
    name: 'source',
    type: 'enum',
    enum: TeacherDailyAttendanceSourceEnum,
    default: TeacherDailyAttendanceSourceEnum.MANUAL,
  })
  source: TeacherDailyAttendanceSourceEnum;

  @Column({ name: 'marked_by', type: 'uuid' })
  marked_by: string;

  @Column({ name: 'marked_at', type: 'timestamp' })
  marked_at: Date;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  // Relationships
  @ManyToOne(() => Teacher, { nullable: true })
  @JoinColumn({ name: 'teacher_id' })
  teacher?: Teacher;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'marked_by' })
  markedBy?: User;
}
