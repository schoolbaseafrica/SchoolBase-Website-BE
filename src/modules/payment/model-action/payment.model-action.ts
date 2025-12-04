import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Payment } from '../entities/payment.entity';
import { PaymentStatus } from '../enums/payment.enums';
export interface IRawMonthlyPayment {
  month: string;
  month_number: string;
  total_payment: string;
}
@Injectable()
export class PaymentModelAction extends AbstractModelAction<Payment> {
  constructor(
    @InjectRepository(Payment)
    private readonly feePaymentRepository: Repository<Payment>,
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

  async getTotalCollected(
    termId?: string,
    sessionId?: string,
  ): Promise<number> {
    const query = this.feePaymentRepository
      .createQueryBuilder('payment')
      .select('COALESCE(SUM(payment.amount_paid), 0)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.PAID });

    if (termId) query.andWhere('payment.term_id = :termId', { termId });
    if (sessionId)
      query.andWhere('payment.session_id = :sessionId', { sessionId });

    const result = await query.getRawOne();
    return parseFloat(result?.total || '0');
  }

  async getCurrentMonthTransactionCount(
    termId?: string,
    sessionId?: string,
  ): Promise<number> {
    const currentMonth = new Date();
    const startOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    );
    const endOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const query = this.feePaymentRepository
      .createQueryBuilder('payment')
      .select('COALESCE(COUNT(*), 0)', 'count')
      .where('payment.status = :status', { status: PaymentStatus.PAID })
      .andWhere('payment.payment_date >= :start', { start: startOfMonth })
      .andWhere('payment.payment_date <= :end', { end: endOfMonth });

    if (termId) query.andWhere('payment.term_id = :termId', { termId });
    if (sessionId)
      query.andWhere('payment.session_id = :sessionId', { sessionId });

    const result = await query.getRawOne();
    return parseInt(result?.count || '0', 10);
  }

  async getMonthlyPaymentBreakdown(
    year: number,
    termId?: string,
    sessionId?: string,
  ): Promise<IRawMonthlyPayment[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const query = this.feePaymentRepository
      .createQueryBuilder('payment')
      .select("TO_CHAR(payment.payment_date, 'Mon')", 'month')
      .addSelect('EXTRACT(MONTH FROM payment.payment_date)', 'month_number')
      .addSelect('COALESCE(SUM(payment.amount_paid), 0)', 'total_payment')
      .where('payment.payment_date >= :startDate', { startDate })
      .andWhere('payment.payment_date <= :endDate', { endDate })
      .andWhere('payment.status = :status', { status: PaymentStatus.PAID })
      .groupBy('month_number')
      .addGroupBy('month')
      .orderBy('month_number', 'ASC');

    if (termId) query.andWhere('payment.term_id = :termId', { termId });
    if (sessionId)
      query.andWhere('payment.session_id = :sessionId', { sessionId });

    return query.getRawMany();
  }
}
