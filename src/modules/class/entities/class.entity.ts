import { Column, Entity, OneToMany } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { Stream } from '../../stream/entities/stream.entity';

import { ClassTeacher } from './class-teacher.entity';

@Entity('classes')
export class Class extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  stream: string;

  @OneToMany(() => ClassTeacher, (assignment) => assignment.class)
  teacher_assignment: ClassTeacher[];

  @OneToMany(() => Stream, (stream) => stream.class)
  streams: Stream[];
}
