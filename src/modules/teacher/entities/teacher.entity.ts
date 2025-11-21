import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ClassTeacher } from '../../classes/entities/class-teacher.entity';
import { User } from '../../user/entities/user.entity';
import { TeacherTitle } from '../enums/teacher.enum';

@Entity('teachers')
export class Teacher {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', unique: true, name: 'user_id' })
  userId: string; // Foreign key to User entity

  @Column({ unique: true, name: 'employment_id' })
  employmentId: string; // e.g., EMP-2025-014

  @Column({ type: 'enum', enum: TeacherTitle })
  title: TeacherTitle; // Mr, Mrs, Miss, Dr, Prof

  @Column({ name: 'photo_url', nullable: true })
  photoUrl: string; // Path to 150x150 image

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean; // For setting a teacher as active or inactive

  // --- Relationships ---
  @OneToOne(() => User, { onDelete: 'CASCADE' }) // If a user is deleted, delete teacher record
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @OneToMany(() => ClassTeacher, (assignment) => assignment.teacher)
  class_assignments: ClassTeacher[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
