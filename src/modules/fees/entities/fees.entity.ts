import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
} from 'class-validator';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';

import { User } from 'src/modules/user/entities/user.entity';

import { BaseEntity } from '../../../entities/base-entity';
import { Term } from '../../academic-term/entities/term.entity';
import { Class } from '../../class/entities/class.entity';
import { FeeStatus } from '../enums/fees.enums';

import { FeeAssignment } from './fee-assignment.entity';

@Entity('fees')
export class Fees extends BaseEntity {
  @Column()
  @IsString()
  @IsNotEmpty()
  component_name: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @Column({ name: 'term_id', type: 'uuid' })
  @IsNotEmpty()
  term_id: string;

  @ManyToOne(() => Term)
  @JoinColumn({ name: 'term_id' })
  term: Term;

  @ManyToMany(() => Class)
  @JoinTable({
    name: 'fee_classes',
    joinColumn: { name: 'fee_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'class_id', referencedColumnName: 'id' },
  })
  classes: Class[];

  @OneToMany(() => FeeAssignment, (assignment) => assignment.fee)
  direct_assignments: FeeAssignment[];

  @Column({ type: 'enum', enum: FeeStatus, default: FeeStatus.ACTIVE })
  @IsEnum(FeeStatus)
  status: FeeStatus;

  @Column({ name: 'created_by', type: 'uuid', nullable: true, select: false })
  created_by: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy?: User;
}
