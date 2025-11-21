import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { Column } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';

export enum TermName {
  FIRST = 'FIRST',
  SECOND = 'SECOND',
  THIRD = 'THIRD',
}

export class Term extends BaseEntity {
  @Column()
  @IsString()
  @IsNotEmpty()
  session_id: string;

  @Column({
    type: 'enum',
    enum: TermName,
  })
  @IsNotEmpty()
  name: TermName;

  @Column({ default: false })
  @IsBoolean()
  is_current: boolean;
}
