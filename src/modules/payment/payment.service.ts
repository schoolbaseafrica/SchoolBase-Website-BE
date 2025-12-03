import { Injectable } from '@nestjs/common';

import { RecordPaymentDto } from './dto/payment.dto';
import { Payment } from './entities/payment.entity';
import { PaymentModelAction } from './model-action/payment.model-action';
import { PaymentValidationService } from './services/payment-validation.service';

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
        student: true,
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
}
