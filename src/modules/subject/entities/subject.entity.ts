import { Column, Entity, Unique } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';

@Entity('subjects')
@Unique(['name'])
export class Subject extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  name: string;
}
