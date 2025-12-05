import { IsNotEmpty, IsUUID } from 'class-validator';

export class StudentFeeDetailsQueryDto {
  @IsNotEmpty()
  @IsUUID()
  @IsNotEmpty()
  @IsUUID()
  term_id: string;

  @IsNotEmpty()
  @IsUUID()
  session_id: string;
}

export class StudentInfoDto {
  student_id: string;
  first_name: string;
  last_name: string;
  registration_number: string;
  class: string;
  term: string;
  session: string;
}

export class FeeBreakdownItemDto {
  component_name: string;
  amount: number;
  amount_paid: number;
  outstanding_amount: number;
  status: 'PAID' | 'PARTIALLY_PAID' | 'OUTSTANDING';
}

export class PaymentHistoryItemDto {
  payment_date: Date;
  amount_paid: number;
  payment_method: string;
  transaction_reference: string;
  fee_component: string;
  term_label: string;
}

export class StudentFeeDetailsResponseDto {
  student_info: StudentInfoDto;
  fee_breakdown: FeeBreakdownItemDto[];
  payment_history: PaymentHistoryItemDto[];
}
