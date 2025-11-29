import { Entity, Column, OneToOne, OneToMany, JoinColumn } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { Class } from '../../class/entities/class.entity';

import { Schedule } from './schedule.entity';

@Entity({ name: 'timetables' })
export class Timetable extends BaseEntity {
  @OneToOne(() => Class, (cls) => cls.timetable, { nullable: false })
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @Column({ name: 'class_id' })
  class_id: string;

  @OneToMany(() => Schedule, (schedule) => schedule.timetable, {
    cascade: true,
  })
  schedules: Schedule[];

  @Column({ default: true })
  is_active: boolean;
}
