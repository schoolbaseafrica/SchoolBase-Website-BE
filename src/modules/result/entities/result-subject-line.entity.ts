import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { Subject } from '../../subject/entities/subject.entity';

import { Result } from './result.entity';

/**
 * Result Subject Line Entity
 *
 * Represents a single subject's grade breakdown within a student's result.
 * Each line contains the subject-specific scores, totals, and grade information.
 */
@Entity('result_subject_lines')
export class ResultSubjectLine extends BaseEntity {
  @Column({ name: 'result_id', type: 'uuid' })
  result_id: string;

  @ManyToOne(() => Result, (result) => result.subject_lines, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'result_id' })
  result: Result;

  @Column({ name: 'subject_id', type: 'uuid' })
  subject_id: string;

  @ManyToOne(() => Subject, { nullable: false })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  /**
   * Continuous Assessment score
   */
  @Column({
    name: 'ca_score',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  ca_score: number | null;

  /**
   * Examination score
   */
  @Column({
    name: 'exam_score',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  exam_score: number | null;

  /**
   * Total score for this subject (ca_score + exam_score)
   */
  @Column({
    name: 'total_score',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  total_score: number | null;

  /**
   * Letter grade for this subject
   */
  @Column({ name: 'grade_letter', type: 'varchar', length: 2, nullable: true })
  grade_letter: string | null;

  /**
   * Remark/comment for this subject
   */
  @Column({ type: 'text', nullable: true })
  remark: string | null;
}
