import { Expose, Type } from 'class-transformer';

import { PaymentMethod, PaymentStatus } from '../enums/payment.enums';

class StudentDto {
  @Expose()
  id: string;

  @Expose()
  first_name: string;

  @Expose()
  last_name: string;
}

class FeeComponentDto {
  @Expose()
  id: string;

  @Expose()
  component_name: string;

  @Expose()
  amount: number;
}

class TermDto {
  @Expose()
  id: string;

  @Expose()
  name: string;
}

export class PaymentResponseDto {
  @Expose()
  id: string;

  @Expose()
  student_id: string;

  @Expose()
  @Type(() => StudentDto)
  student: StudentDto;

  @Expose()
  fee_component_id: string;

  @Expose()
  @Type(() => FeeComponentDto)
  fee_component: FeeComponentDto;

  @Expose()
  amount_paid: number;

  @Expose()
  payment_method: PaymentMethod;

  @Expose()
  payment_date: Date;

  @Expose()
  term_id: string;

  @Expose()
  @Type(() => TermDto)
  term: TermDto;

  @Expose()
  session_id: string;

  @Expose()
  invoice_number: string;

  @Expose()
  transaction_id: string;

  @Expose()
  receipt_url: string;

  @Expose()
  status: PaymentStatus;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
