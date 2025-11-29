import { Entity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { ClassTeacher, ClassSubject } from '../../class/entities';
import { User } from '../../user/entities/user.entity';
import { TeacherTitle } from '../enums/teacher.enum';

@Entity('teachers')
export class Teacher extends BaseEntity {
  @Column({ type: 'uuid', unique: true, name: 'user_id' })
  user_id: string; // Foreign key to User entity

  @Column({ unique: true, name: 'employment_id' })
  employment_id: string; // e.g., EMP-2025-014

  @Column({ type: 'enum', enum: TeacherTitle })
  title: TeacherTitle; // Mr, Mrs, Miss, Dr, Prof

  @Column({ name: 'photo_url', nullable: true })
  photo_url: string; // Path to 150x150 image

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  is_active: boolean; // For setting a teacher as active or inactive

  // --- Relationships ---
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @OneToMany(() => ClassTeacher, (assignment) => assignment.teacher)
  class_assignments: ClassTeacher[];

  @OneToMany(() => ClassSubject, (assignment) => assignment.teacher)
  subject_assignments: ClassSubject[];
}
