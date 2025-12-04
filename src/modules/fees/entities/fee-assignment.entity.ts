import { Entity, JoinColumn, ManyToOne, Column } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { Student } from '../../student/entities/student.entity';

import { Fees } from './fees.entity';

@Entity('fee_assignments')
export class FeeAssignment extends BaseEntity {
  @Column({ name: 'fee_id', type: 'uuid' })
  fee_id: string;

  @ManyToOne(() => Fees, (fee) => fee.direct_assignments)
  @JoinColumn({ name: 'fee_id' })
  fee: Fees;

  @Column({ name: 'student_id', type: 'uuid' })
  student_id: string;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;
}
