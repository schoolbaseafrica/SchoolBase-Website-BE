import { Expose, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  IsEnum,
  IsDateString,
  IsOptional,
  Min,
} from 'class-validator';

import { PaymentMethod, PaymentStatus } from '../enums/payment.enums';

export class RecordPaymentDto {
  @IsUUID()
  @IsNotEmpty()
  student_id: string;

  @IsUUID()
  @IsNotEmpty()
  fee_component_id: string;

  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount_paid: number;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  payment_method: PaymentMethod;

  @IsDateString()
  @IsNotEmpty()
  payment_date: string;

  @IsUUID()
  @IsNotEmpty()
  term_id: string;

  @IsUUID()
  @IsNotEmpty()
  session_id: string;

  @IsString()
  @IsOptional()
  invoice_number?: string;

  @IsString()
  @IsOptional()
  transaction_id?: string;
}

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
