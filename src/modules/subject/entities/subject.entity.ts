import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { Class } from '../../classes/entities/classes.entity';

@Entity('subjects')
export class Subject extends BaseEntity {
  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'varchar', nullable: false, unique: true })
  code: string;

  // class_level should be a FK → class table
  @ManyToOne(() => Class, (cls) => cls.id, { nullable: false })
  @JoinColumn({ name: 'class_id' })
  class_id: Class;
}
