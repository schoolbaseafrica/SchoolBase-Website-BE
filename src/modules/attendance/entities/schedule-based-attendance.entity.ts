import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';

import { Schedule } from '../../timetable/entities/schedule.entity';
import { AttendanceStatus } from '../enums';

import { BaseAttendanceEntity } from './attendance.entity';

/**
 * Schedule-based attendance - tracks attendance per class period/subject
 * Multiple records per student per day (one for each scheduled period)
 */
@Entity('attendance_records')
@Index(['student_id', 'schedule_id', 'date'], { unique: true })
@Index(['schedule_id'])
@Index(['student_id'])
@Index(['date'])
@Index(['session_id'])
export class ScheduleBasedAttendance extends BaseAttendanceEntity {
  @Column({ name: 'schedule_id', type: 'uuid' })
  schedule_id: string;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.ABSENT,
  })
  status: AttendanceStatus;

  // Schedule relation
  @ManyToOne(() => Schedule, { nullable: true })
  @JoinColumn({ name: 'schedule_id' })
  schedule?: Schedule;
}
