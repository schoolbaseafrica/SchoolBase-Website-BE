import { Column, Entity, ManyToMany } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { Stream } from '../../stream/entities/stream.entity';
import { RoomStatus } from '../enums/room-enum';

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

  @Column({
    type: 'enum',
    name: 'status',
    enum: RoomStatus,
    default: RoomStatus.AVAILABLE,
  })
  status: RoomStatus;

  @ManyToMany(() => Stream, (stream) => stream.rooms)
  streams: Stream[];
}
