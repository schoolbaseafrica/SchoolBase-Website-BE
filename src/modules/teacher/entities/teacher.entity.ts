import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

import { ClassTeacher } from '../../classes/entities/class-teacher.entity';

@Entity()
export class Teacher {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @OneToMany(() => ClassTeacher, (assignment) => assignment.teacher)
  class_assignments: ClassTeacher[];
}
