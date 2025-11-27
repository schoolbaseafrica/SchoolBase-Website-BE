import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';

export enum TermName {
  FIRST = 'FIRST',
  SECOND = 'SECOND',
  THIRD = 'THIRD',
}

@Entity('terms')
export class Term extends BaseEntity {
  @Column()
  session_id!: string;

  @Column({
    type: 'enum',
    enum: TermName,
  })
  name!: TermName;

  @Column({ default: false })
  is_current!: boolean;
}
