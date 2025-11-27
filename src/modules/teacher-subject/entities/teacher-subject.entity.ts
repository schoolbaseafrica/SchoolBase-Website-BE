import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { Subject } from '../../subject/entities/subject.entity';
import { Teacher } from '../../teacher/entities/teacher.entity';

@Entity('teacher_subjects')
@Unique(['teacher_id', 'subject_id'])
export class TeacherSubject extends BaseEntity {
  @ManyToOne(() => Teacher, { nullable: false })
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

  @Column({ name: 'teacher_id' })
  teacher_id: string;

  @ManyToOne(() => Subject, { nullable: false })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ name: 'subject_id' })
  subject_id: string;

  @Column({ name: 'subject_id' })
  class_id: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;
}
