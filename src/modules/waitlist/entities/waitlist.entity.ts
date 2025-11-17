import { Entity, Column } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';

@Entity('waitlist')
export class Waitlist extends BaseEntity {
  @Column({ name: 'first_name', type: 'varchar', length: 120 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 120 })
  lastName: string;

  @Column({ type: 'varchar', length: 180, unique: true })
  email: string;
}
