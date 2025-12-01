import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { AcademicSession } from '../../academic-session/entities/academic-session.entity';

export enum TermName {
  FIRST = 'First term',
  SECOND = 'Second term',
  THIRD = 'Third term',
}

export enum TermStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Entity('terms')
export class Term extends BaseEntity {
  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => AcademicSession, (session) => session.terms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  academicSession: AcademicSession;

  @Column({
    type: 'enum',
    enum: TermName,
  })
  name: TermName;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: TermStatus,
    default: TermStatus.ACTIVE,
  })
  status: TermStatus;

  @Column({ name: 'is_current', default: false })
  isCurrent: boolean;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp with time zone' })
  deletedAt?: Date;
}
