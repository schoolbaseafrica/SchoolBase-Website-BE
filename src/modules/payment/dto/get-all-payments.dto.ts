import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

import { PaymentMethod, PaymentStatus } from '../enums/payment.enums';

import { PaymentResponseDto } from './payment.dto';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

// MODIFIED ENUM: Use clean, public keys
export enum PaymentSortBy {
  PAYMENT_DATE = 'PAYMENT_DATE',
  AMOUNT = 'AMOUNT',
  STUDENT_NAME = 'STUDENT_NAME',
  FEE_NAME = 'FEE_NAME',
}

export class FetchPaymentsDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @IsEnum(PaymentSortBy)
  @IsOptional()
  sort_by?: PaymentSortBy = PaymentSortBy.PAYMENT_DATE;

  @IsEnum(SortOrder)
  @IsOptional()
  sort_order?: SortOrder = SortOrder.DESC;

  @IsString()
  @IsOptional()
  search?: string;

  @Type(() => String)
  @IsUUID()
  @IsOptional()
  student_id?: string;

  @Type(() => String)
  @IsUUID()
  @IsOptional()
  fee_component_id?: string;

  @Type(() => String)
  @IsUUID()
  @IsOptional()
  term_id?: string;

  @Type(() => String)
  @IsUUID()
  @IsOptional()
  session_id?: string;

  @IsEnum(PaymentMethod)
  @IsOptional()
  payment_method?: PaymentMethod;

  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;
}

export class PaginatedPaymentsResponseDto {
  payments: PaymentResponseDto[];
  total: number;
  page: number;
  limit: number;
}
