import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { User } from '../../user/entities/user.entity';

import { Class } from './class.entity';

@Entity('streams')
@Unique(['name', 'class'])
export class Stream extends BaseEntity {
  @Column()
  name: string;

  @ManyToOne(() => Class, (classEntity) => classEntity.streams, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @OneToMany(() => User, (user) => user.stream)
  students: User[];
}
