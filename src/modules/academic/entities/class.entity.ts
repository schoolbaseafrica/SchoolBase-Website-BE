import { Column, Entity, OneToMany, Unique } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { Stream } from './stream.entity';

@Entity('classes')
@Unique(['name']) 
export class Class extends BaseEntity {
  @Column()
  name: string;

  @Column()
  level: string; // e.g. "JSS1", "SSS2", "Primary 1"

  @OneToMany(() => Stream, (stream) => stream.class)
  streams: Stream[];
}