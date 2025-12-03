import { Column, ManyToOne, JoinColumn } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { Student } from '../../student/entities/student.entity';
import { User } from '../../user/entities/user.entity';

/**
 * Base attendance entity with common fields for all attendance types
 * This abstract class provides shared fields and relations
 */
export abstract class BaseAttendanceEntity extends BaseEntity {
  @Column({ name: 'student_id', type: 'uuid' })
  student_id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  session_id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'marked_by', type: 'uuid' })
  marked_by: string;

  @Column({ name: 'marked_at', type: 'timestamp', default: () => 'now()' })
  marked_at: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Common relations
  @ManyToOne(() => Student, { nullable: true })
  @JoinColumn({ name: 'student_id' })
  student?: Student;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'marked_by' })
  markedBy?: User;
}
