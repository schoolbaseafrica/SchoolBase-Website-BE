import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';

import { Class } from '../../class/entities/class.entity';
import { DailyAttendanceStatus } from '../enums';

import { BaseAttendanceEntity } from './attendance.entity';

/**
 * Daily student attendance - one record per student per day
 * This tracks overall daily presence (morning register)
 */
@Entity('student_daily_attendance')
@Index(['student_id', 'class_id', 'date'], { unique: true })
@Index(['class_id'])
@Index(['student_id'])
@Index(['date'])
@Index(['session_id'])
export class StudentDailyAttendance extends BaseAttendanceEntity {
  @Column({ name: 'class_id', type: 'uuid' })
  class_id: string;

  @Column({
    type: 'enum',
    enum: DailyAttendanceStatus,
    default: DailyAttendanceStatus.ABSENT,
  })
  status: DailyAttendanceStatus;

  @Column({ type: 'timestamp', nullable: true })
  check_in_time?: Date;

  @Column({ type: 'timestamp', nullable: true })
  check_out_time?: Date;

  // Class relation
  @ManyToOne(() => Class, { nullable: true })
  @JoinColumn({ name: 'class_id' })
  class?: Class;
}
