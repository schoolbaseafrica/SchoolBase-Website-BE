import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { Student } from '../../student/entities/student.entity';

import { Class } from './class.entity';

@Entity('class_students')
export class ClassStudent extends BaseEntity {
  @Column({ name: 'session_id' })
  session_id: string;

  @CreateDateColumn({ name: 'enrollment_date' })
  enrollment_date: Date;

  @Column({ name: 'is_active', default: true })
  is_active: boolean;

  @ManyToOne(() => Class, (cls) => cls.student_assignments)
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @ManyToOne(() => Student, (student) => student.class_assignments)
  @JoinColumn({ name: 'student_id' })
  student: Student;
}
