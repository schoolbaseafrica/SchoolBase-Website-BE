import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FeePayment } from '../entities/payment.entity';

@Injectable()
export class FeePaymentModelAction extends AbstractModelAction<FeePayment> {
  constructor(
    @InjectRepository(FeePayment)
    feePaymentRepository: Repository<FeePayment>,
  ) {
    super(feePaymentRepository, FeePayment);
  }

  async getTotalPaidByStudent(
    studentId: string,
    feeComponentId: string,
    termId: string,
  ): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount_paid)', 'total')
      .where('payment.student_id = :student_id', { studentId })
      .andWhere('payment.fee_component_id = :fee_component_id', {
        feeComponentId,
      })
      .andWhere('payment.term_id = :term_id', { termId })
      .andWhere('payment.status = :status', { status: 'completed' })
      .getRawOne();

    return parseFloat(result?.total) || 0;
  }
}
