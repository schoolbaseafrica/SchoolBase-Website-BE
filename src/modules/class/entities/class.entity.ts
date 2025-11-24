import { Entity, Column, OneToMany, Unique } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';

import { ClassTeacher } from './class-teacher.entity';

@Entity()
@Unique(['normalized_name', 'normalized_stream', 'session_id'])
export class Class extends BaseEntity {
  @Column()
  session_id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  stream?: string;

  @Column()
  normalized_name: string;

  @Column()
  normalized_stream: string;

  @OneToMany(() => ClassTeacher, (assignment) => assignment.class)
  teacher_assignment: ClassTeacher[];
}
