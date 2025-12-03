import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { Student } from 'src/modules/student/entities';

import { BaseEntity } from '../../../entities/base-entity';
import { Term } from '../../academic-term/entities/term.entity';
import { Fees } from '../../fees/entities/fees.entity';
import { User } from '../../user/entities/user.entity';
import { PaymentMethod, PaymentStatus } from '../enums/payment.enums';

@Entity('payments')
export class Payment extends BaseEntity {
  @Column({ name: 'student_id', type: 'uuid' })
  @IsNotEmpty()
  student_id: string;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'fee_component_id', type: 'uuid' })
  @IsNotEmpty()
  fee_component_id: string;

  @ManyToOne(() => Fees)
  @JoinColumn({ name: 'fee_component_id' })
  fee_component: Fees;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  @IsNumber()
  @IsNotEmpty()
  amount_paid: number;

  @Column({ type: 'enum', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  payment_method: PaymentMethod;

  @Column({ type: 'timestamp' })
  @IsNotEmpty()
  payment_date: Date;

  @Column({ name: 'term_id', type: 'uuid' })
  @IsNotEmpty()
  term_id: string;

  @ManyToOne(() => Term)
  @JoinColumn({ name: 'term_id' })
  term: Term;

  @Column({ name: 'session_id', type: 'uuid' })
  @IsNotEmpty()
  session_id: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  invoice_number: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  transaction_id?: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  receipt_url: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PAID,
  })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @Column({ name: 'recorded_by', type: 'uuid' })
  recorded_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recorded_by' })
  recorded_by_user: User;
}
