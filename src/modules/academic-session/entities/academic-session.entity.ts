import { Entity, Column, OneToMany, DeleteDateColumn } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { Term } from '../../academic-term/entities/term.entity';

export enum SessionStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  ARCHIVED = 'Archived',
}

@Entity('academic_sessions')
export class AcademicSession extends BaseEntity {
  @Column({
    name: 'academic_year',
    type: 'varchar',
    length: 50,
    unique: true,
    nullable: true,
  })
  academicYear?: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.ACTIVE,
  })
  status: SessionStatus;

  @OneToMany(() => Term, (term) => term.academicSession, {
    cascade: true,
    eager: true,
  })
  terms?: Term[];

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp with time zone' })
  deletedAt?: Date;
}
