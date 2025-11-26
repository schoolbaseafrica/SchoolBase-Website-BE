import { Column, Entity, ManyToMany } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { Stream } from '../../stream/entities/stream.entity';
import { RoomStatus, RoomType } from '../enums/room-enum';

@Entity('rooms')
export class Room extends BaseEntity {
  @Column({ type: 'varchar', name: 'name', length: 255, unique: true })
  name: string;

  @Column({
    type: 'enum',
    name: 'type',
    enum: RoomType,
    default: RoomType.PHYSICAL,
  })
  type: RoomType;

  @Column({
    type: 'enum',
    name: 'status',
    enum: RoomStatus,
    default: RoomStatus.AVAILABLE,
  })
  status: RoomStatus;

  @Column({ type: 'int', name: 'capacity', nullable: true })
  capacity: number;

  @Column({ type: 'varchar', name: 'location', length: 255, nullable: false })
  location: string;

  @Column({ type: 'varchar', name: 'building', length: 255, nullable: true })
  building: string;

  @Column({ type: 'varchar', name: 'floor', length: 255, nullable: true })
  floor: string;

  @Column({ type: 'varchar', name: 'description', length: 255, nullable: true })
  description: string;

  @ManyToMany(() => Stream, (stream) => stream.rooms)
  streams: Stream[];
}
