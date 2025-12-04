import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { AcademicSession } from '../../academic-session/entities/academic-session.entity';
import { Term } from '../../academic-term/entities/term.entity';
import { Class } from '../../class/entities/class.entity';
import { Student } from '../../student/entities/student.entity';

import { ResultSubjectLine } from './result-subject-line.entity';

/**
 * Result Entity
 *
 * Represents a student's overall result for a specific academic term.
 * This aggregates all subject grades for a student in a term and includes
 * computed metrics like total score, average, position, and remarks.
 */
@Unique(['student_id', 'class_id', 'term_id', 'academic_session_id'])
@Entity('results')
export class Result extends BaseEntity {
  @Column({ name: 'student_id', type: 'uuid' })
  student_id: string;

  @ManyToOne(() => Student, { nullable: false })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'class_id', type: 'uuid' })
  class_id: string;

  @ManyToOne(() => Class, { nullable: false })
  @JoinColumn({ name: 'class_id' })
  class: Class;

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

  /**
   * Total score across all subjects
   */
  @Column({
    name: 'total_score',
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
  })
  total_score: number | null;

  /**
   * Average score (total_score / number of subjects)
   */
  @Column({
    name: 'average_score',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  average_score: number | null;

  /**
   * Overall grade letter based on average score
   */
  @Column({ name: 'grade_letter', type: 'varchar', length: 2, nullable: true })
  grade_letter: string | null;

  /**
   * Student's position in class (1st, 2nd, 3rd, etc.)
   */
  @Column({ name: 'position', type: 'integer', nullable: true })
  position: number | null;

  /**
   * Overall remark/comment for the term
   */
  @Column({ type: 'text', nullable: true })
  remark: string | null;

  /**
   * Number of subjects with valid grades
   */
  @Column({ name: 'subject_count', type: 'integer', default: 0 })
  subject_count: number;

  /**
   * Timestamp when result was generated
   */
  @Column({ name: 'generated_at', type: 'timestamp', nullable: true })
  generated_at: Date | null;

  /**
   * Per-subject result lines
   */
  @OneToMany(() => ResultSubjectLine, (line) => line.result, {
    cascade: true,
  })
  subject_lines: ResultSubjectLine[];
}
