import { Entity, Column } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';

@Entity('departments')
export class Department extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;
}
