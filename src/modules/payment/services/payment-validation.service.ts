import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { FeesModelAction } from 'src/modules/fees/model-action/fees.model-action';

import * as sysMsg from '../../../constants/system.messages';
import { RecordPaymentDto } from '../dto/payment.dto';
import { PaymentModelAction } from '../model-action/payment.model-action';

@Injectable()
export class PaymentValidationService {
  constructor(
    private readonly feesModelAction: FeesModelAction,
    private readonly feePaymentModelAction: PaymentModelAction,
  ) {}

  async validatePayment(dto: RecordPaymentDto): Promise<void> {
    const fee = await this.feesModelAction.get({
      identifierOptions: { id: dto.fee_component_id },
      relations: { classes: true },
    });

    if (!fee) {
      throw new NotFoundException(sysMsg.FEE_NOT_FOUND);
    }

    if (fee.term_id !== dto.term_id) {
      throw new BadRequestException(sysMsg.FEE_NOT_FOR_TERM);
    }

    const total_paid = await this.feePaymentModelAction.getTotalPaidByStudent(
      dto.student_id,
      dto.fee_component_id,
      dto.term_id,
    );

    const new_total = total_paid + dto.amount_paid;

    if (new_total > fee.amount) {
      throw new BadRequestException(
        `Payment amount exceeds fee balance. Fee: ${fee.amount}, Already paid: ${total_paid}, Attempting: ${dto.amount_paid}`,
      );
    }
  }
}
