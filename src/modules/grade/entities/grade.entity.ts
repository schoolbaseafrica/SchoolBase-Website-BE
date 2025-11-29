import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { Student } from '../../student/entities/student.entity';

import { GradeSubmission } from './grade-submission.entity';

@Entity('grades')
export class Grade extends BaseEntity {
  @Column({ name: 'submission_id', type: 'uuid' })
  submission_id: string;

  @ManyToOne(() => GradeSubmission, (submission) => submission.grades, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'submission_id' })
  submission: GradeSubmission;

  @Column({ name: 'student_id', type: 'uuid' })
  student_id: string;

  @ManyToOne(() => Student, { nullable: false })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({
    name: 'ca_score',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  ca_score: number | null;

  @Column({
    name: 'exam_score',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  exam_score: number | null;

  @Column({
    name: 'total_score',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  total_score: number | null;

  @Column({ name: 'grade_letter', type: 'varchar', length: 2, nullable: true })
  grade_letter: string | null;

  @Column({ type: 'text', nullable: true })
  comment: string | null;
}
