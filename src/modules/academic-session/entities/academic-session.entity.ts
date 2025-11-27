import { Entity, Column, OneToMany } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity'; // Assuming BaseEntity path
import { Term } from '../../academic-term/entities/term.entity';

export enum SessionStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Entity('academic_sessions')
export class AcademicSession extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ name: 'academic_year', type: 'varchar', length: 50 })
  academicYear: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.INACTIVE,
  })
  status: SessionStatus;

  @OneToMany(() => Term, (term) => term.academicSession, {
    cascade: true,
    eager: true,
  })
  terms: Term[];
}
