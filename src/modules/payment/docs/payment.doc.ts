import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

export function recordPaymentDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Record a new fee payment',
      description:
        'Creates a payment record with full validation and audit tracking',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: [
          'student_id',
          'fee_component_id',
          'amount_paid',
          'payment_method',
          'payment_date',
          'term_id',
          'session_id',
        ],
        properties: {
          student_id: { type: 'string', format: 'uuid' },
          fee_component_id: { type: 'string', format: 'uuid' },
          amount_paid: { type: 'number', minimum: 0.01 },
          payment_method: {
            type: 'string',
            enum: ['cash', 'bank_transfer', 'card', 'mobile_money', 'cheque'],
          },
          payment_date: { type: 'string', format: 'date-time' },
          term_id: { type: 'string', format: 'uuid' },
          session_id: { type: 'string', format: 'uuid' },
          invoice_number: { type: 'string', nullable: true },
          receipt_file: {
            type: 'string',
            format: 'binary',
            nullable: true,
            description: 'Optional receipt file (PNG, JPG, PDF, max 5MB)',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Payment recorded successfully',
      schema: {
        type: 'object',
        properties: {
          status_code: { type: 'number', example: 201 },
          message: { type: 'string', example: 'Payment recorded successfully' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              student_id: { type: 'string', format: 'uuid' },
              fee_component_id: { type: 'string', format: 'uuid' },
              amount_paid: { type: 'number' },
              payment_method: { type: 'string' },
              payment_date: { type: 'string', format: 'date-time' },
              transaction_id: { type: 'string' },
              receipt_url: { type: 'string' },
              status: { type: 'string' },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Validation error or overpayment',
    }),
    ApiResponse({ status: 404, description: 'Fee component not found' }),
  );
}
