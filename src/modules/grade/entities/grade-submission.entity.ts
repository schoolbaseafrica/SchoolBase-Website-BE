import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { AcademicSession } from '../../academic-session/entities/academic-session.entity';
import { Term } from '../../academic-term/entities/term.entity';
import { Class } from '../../class/entities/class.entity';
import { Subject } from '../../subject/entities/subject.entity';
import { Teacher } from '../../teacher/entities/teacher.entity';
import { User } from '../../user/entities/user.entity';

import { Grade } from './grade.entity';

export enum GradeSubmissionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('grade_submissions')
export class GradeSubmission extends BaseEntity {
  @Column({ name: 'teacher_id', type: 'uuid' })
  teacher_id: string;

  @ManyToOne(() => Teacher, { nullable: false })
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

  @Column({ name: 'class_id', type: 'uuid' })
  class_id: string;

  @ManyToOne(() => Class, { nullable: false })
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @Column({ name: 'subject_id', type: 'uuid' })
  subject_id: string;

  @ManyToOne(() => Subject, { nullable: false })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ name: 'term_id', type: 'uuid' })
  term_id: string;

  @ManyToOne(() => Term, { nullable: false })
  @JoinColumn({ name: 'term_id' })
  term: Term;

  @Column({ name: 'academic_session_id', type: 'uuid' })
  academic_session_id: string;

  @ManyToOne(() => AcademicSession, { nullable: false })
  @JoinColumn({ name: 'academic_session_id' })
  academicSession: AcademicSession;

  @Column({
    type: 'enum',
    enum: GradeSubmissionStatus,
    default: GradeSubmissionStatus.DRAFT,
  })
  status: GradeSubmissionStatus;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submitted_at: Date | null;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewed_at: Date | null;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewed_by: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer: User;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejection_reason: string | null;

  // One submission has many grades (one per student)
  @OneToMany(() => Grade, (grade) => grade.submission, { cascade: true })
  grades: Grade[];
}
