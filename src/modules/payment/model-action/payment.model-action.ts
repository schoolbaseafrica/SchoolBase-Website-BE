import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Payment } from '../entities/payment.entity';

@Injectable()
export class PaymentModelAction extends AbstractModelAction<Payment> {
  constructor(
    @InjectRepository(Payment)
    feePaymentRepository: Repository<Payment>,
  ) {
    super(feePaymentRepository, Payment);
  }

  async getTotalPaidByStudent(
    studentId: string,
    feeComponentId: string,
    termId: string,
  ): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount_paid)', 'total')
      .where('payment.student_id = :studentId', { studentId })
      .andWhere('payment.fee_component_id = :feeComponentId', {
        feeComponentId,
      })
      .andWhere('payment.term_id = :termId', { termId })
      .andWhere('payment.status = :status', { status: 'paid' })
      .getRawOne();

    return parseFloat(result?.total) || 0;
  }
}
