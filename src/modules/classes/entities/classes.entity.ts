import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

import { ClassTeacher } from './class-teacher.entity';

@Entity()
export class Class {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // e.g., "Grade 10"

  @Column({ nullable: true })
  stream: string; // e.g., "Science", "Arts", "Commerce"

  @OneToMany(() => ClassTeacher, (assignment) => assignment.class)
  teacher_assignment: ClassTeacher[];
}
