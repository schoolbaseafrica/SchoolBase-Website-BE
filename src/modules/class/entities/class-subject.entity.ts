import { Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { Subject } from '../../subject/entities/subject.entity';

import { Class } from './class.entity';

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
}
