import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { Student } from '../../student/entities/student.entity';
import { Schedule } from '../../timetable/entities/schedule.entity';
import { User } from '../../user/entities/user.entity';
import { AttendanceStatus } from '../enums';

@Entity('attendance_records')
@Index(['student_id', 'schedule_id', 'date'], { unique: true })
@Index(['schedule_id'])
@Index(['student_id'])
@Index(['date'])
@Index(['session_id'])
export class Attendance extends BaseEntity {
  @Column({ name: 'schedule_id', type: 'uuid' })
  schedule_id: string;

  @Column({ name: 'student_id', type: 'uuid' })
  student_id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  session_id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.ABSENT,
  })
  status: AttendanceStatus;

  @Column({ name: 'marked_by', type: 'uuid' })
  marked_by: string;

  @Column({ name: 'marked_at', type: 'timestamp', default: () => 'now()' })
  marked_at: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Optional relations (for future deep queries)
  @ManyToOne(() => Schedule, { nullable: true })
  @JoinColumn({ name: 'schedule_id' })
  schedule?: Schedule;

  @ManyToOne(() => Student, { nullable: true })
  @JoinColumn({ name: 'student_id' })
  student?: Student;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'marked_by' })
  markedBy?: User;
}
