import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class DashboardAnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by term ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  term_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by session ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  session_id?: string;

  @ApiPropertyOptional({
    description: 'Year for monthly breakdown (defaults to current year)',
    example: 2025,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year?: number;
}

export interface IMonthlyPaymentData {
  month: string;
  total_payment: number;
}

export interface IDashboardTotals {
  total_expected_fees: number;
  total_paid: number;
  outstanding_balance: number;
  transaction_this_month: number;
}

export class DashboardAnalyticsResponseDto {
  totals: IDashboardTotals;
  monthly_payments: IMonthlyPaymentData[];
}
