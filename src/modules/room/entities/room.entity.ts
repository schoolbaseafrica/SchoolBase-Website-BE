import { Column, Entity, OneToMany } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { Schedule } from '../../timetable/entities/schedule.entity';

@Entity('rooms')
export class Room extends BaseEntity {
  @Column({
    type: 'varchar',
    name: 'name',
    length: 255,
    unique: true,
    nullable: false,
  })
  name: string;

  @Column({ type: 'varchar', name: 'type', length: 255, nullable: false })
  type: string;

  @Column({ type: 'int', name: 'capacity', nullable: false })
  capacity: number;

  @Column({ type: 'varchar', name: 'location', length: 255, nullable: false })
  location: string;

  @OneToMany(() => Schedule, (schedule) => schedule.room)
  schedules: Schedule[];
}
