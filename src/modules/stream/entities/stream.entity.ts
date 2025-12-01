import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { Class } from '../../class/entities/class.entity';
import { Student } from '../../student/entities/student.entity';

@Entity('stream')
@Index(['class_id'])
@Unique(['class_id', 'name'])
export class Stream extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'class_id', type: 'uuid' })
  class_id: string;

  @ManyToOne(() => Class, (classEntity) => classEntity.streams, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @OneToMany(() => Student, (student) => student.stream)
  students: Student[];
}
