import { IsBoolean, IsNotEmpty, IsString, IsDateString } from 'class-validator';
import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { AcademicSession } from '../../academic-session/entities/academic-session.entity';

export enum TermName {
  FIRST = 'First term',
  SECOND = 'Second term',
  THIRD = 'Third term',
}

@Entity('terms')
export class Term extends BaseEntity {
  @Column({ name: 'session_id', type: 'uuid' })
  @IsString()
  @IsNotEmpty()
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
  @IsNotEmpty()
  name: TermName;

  @Column({ name: 'start_date', type: 'date' })
  @IsDateString()
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  @IsDateString()
  endDate: Date;

  @Column({ name: 'is_current', default: false })
  @IsBoolean()
  isCurrent: boolean;
}
