import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { Subject } from '../../subject/entities/subject.entity';
import { Teacher } from '../../teacher/entities/teacher.entity';

import { Class } from './class.entity';

@Unique(['class', 'subject'])
@Entity('class_subjects')
export class ClassSubject extends BaseEntity {
  @ManyToOne(() => Class, (cls) => cls.classSubjects, { nullable: false })
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @ManyToOne(() => Subject, (subject) => subject.classSubjects, {
    nullable: false,
  })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @ManyToOne(() => Teacher, (teacher) => teacher.subject_assignments)
  @JoinColumn({ name: 'teacher_id' })
  teacher?: Teacher;

  @Column({ type: 'timestamp', nullable: true })
  teacher_assignment_date: Date | null;
}
