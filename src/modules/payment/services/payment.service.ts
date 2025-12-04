import { PaginationMeta } from '@hng-sdk/orm'; // Import PaginationMeta
import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';

import { FetchPaymentsDto, PaymentSortBy } from '../dto/get-all-payments.dto'; // CORRECT IMPORT
import { RecordPaymentDto } from '../dto/payment.dto';
import { Payment } from '../entities/payment.entity';
import { PaymentModelAction } from '../model-action/payment.model-action';

import { PaymentValidationService } from './payment-validation.service';

// NEW: Define the mapping from clean public keys to internal database paths
const SORT_MAPPING: Record<PaymentSortBy, string> = {
  [PaymentSortBy.PAYMENT_DATE]: 'payment.payment_date',
  [PaymentSortBy.AMOUNT]: 'payment.amount_paid',
  [PaymentSortBy.STUDENT_NAME]: 'user.first_name', // Joins on student.user
  [PaymentSortBy.FEE_NAME]: 'fee_component.component_name', // Joins on fee_component
};

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentModelAction: PaymentModelAction,
    private readonly paymentValidationService: PaymentValidationService,
  ) {}

  async recordPayment(
    dto: RecordPaymentDto,
    userId: string,
    receiptUrl?: string,
  ): Promise<Payment> {
    await this.paymentValidationService.validatePayment(dto);
    const transactionId = this.generateTransactionId();
    const payment = await this.paymentModelAction.create({
      createPayload: {
        student_id: dto.student_id,
        fee_component_id: dto.fee_component_id,
        amount_paid: dto.amount_paid,
        payment_method: dto.payment_method,
        payment_date: new Date(dto.payment_date),
        term_id: dto.term_id,
        session_id: dto.session_id,
        invoice_number: dto.invoice_number,
        receipt_url: receiptUrl,
        recorded_by: userId,
        transaction_id: transactionId,
      },
      transactionOptions: { useTransaction: false },
    });

    return this.paymentModelAction.get({
      identifierOptions: { id: payment.id },
      relations: {
        student: { user: true },
        fee_component: true,
        term: true,
      },
    });
  }

  private generateTransactionId(): string {
    const prefix = 'HNG';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}/${random}/${timestamp}`;
  }

  async fetchAllPayments(
    dto: FetchPaymentsDto,
  ): Promise<{ payments: Payment[]; total: number }> {
    const result = await this.searchPaymentsWithQueryBuilder(dto);

    return { payments: result.payload, total: result.paginationMeta.total };
  }

  // --- PRIVATE HELPER METHOD (Using Model Action Repository Access) ---
  protected async searchPaymentsWithQueryBuilder(
    dto: FetchPaymentsDto,
  ): Promise<{
    payload: Payment[];
    paginationMeta: Partial<PaginationMeta>;
  }> {
    const {
      page = 1,
      limit = 10,
      sort_by,
      sort_order,
      search,
      student_id,
      fee_component_id,
      term_id,
      session_id,
      payment_method,
      status,
    } = dto;

    const skip = (page - 1) * limit;

    // Access the repository via the private index property, matching the parent service pattern
    const repository = this.paymentModelAction['repository'];

    const queryBuilder: SelectQueryBuilder<Payment> = repository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('payment.fee_component', 'fee_component')
      .leftJoinAndSelect('payment.term', 'term');

    // MAPPING IMPLEMENTATION: Convert the clean sort_by key to the DB path
    const orderByColumn = sort_by ? SORT_MAPPING[sort_by] : 'payment.createdAt';
    queryBuilder.orderBy(orderByColumn, sort_order || 'DESC');

    // Filtering
    if (student_id) {
      queryBuilder.andWhere('payment.student_id = :student_id', {
        student_id,
      });
    }

    if (fee_component_id) {
      queryBuilder.andWhere('payment.fee_component_id = :fee_component_id', {
        fee_component_id,
      });
    }

    if (term_id) {
      queryBuilder.andWhere('payment.term_id = :term_id', { term_id });
    }

    if (session_id) {
      queryBuilder.andWhere('payment.session_id = :session_id', {
        session_id,
      });
    }

    if (payment_method) {
      queryBuilder.andWhere('payment.payment_method = :payment_method', {
        payment_method,
      });
    }

    if (status) {
      queryBuilder.andWhere('payment.status = :status', { status });
    }

    // Search (student name, invoice number, or transaction ID)
    if (search) {
      const formattedSearch = `%${search.toLowerCase()}%`;
      queryBuilder.andWhere(
        '(LOWER(user.first_name) ILIKE :search OR LOWER(user.last_name) ILIKE :search OR LOWER(payment.invoice_number) ILIKE :search OR LOWER(payment.transaction_id) ILIKE :search)',
        { search: formattedSearch },
      );
    }

    // Get Total Count (must be done before limit/offset)
    const total = await queryBuilder.getCount();

    const payload = await queryBuilder.skip(skip).take(limit).getMany();

    const paginationMeta: Partial<PaginationMeta> = {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };

    return { payload, paginationMeta };
  }
}
