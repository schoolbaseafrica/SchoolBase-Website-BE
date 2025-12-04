import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

export function getDashboardAnalyticsDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Fetch fees dashboard analytics',
      description:
        'Retrieves aggregated analytics for fees dashboard including totals (expected fees, paid, outstanding balance) and monthly payment breakdown. Supports filtering by term and session.',
    }),
    ApiQuery({
      name: 'term_id',
      required: false,
      type: String,
      description: 'Filter analytics by specific academic term',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiQuery({
      name: 'session_id',
      required: false,
      type: String,
      description: 'Filter analytics by specific academic session',
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    ApiQuery({
      name: 'year',
      required: false,
      type: Number,
      description: 'Year for monthly breakdown (defaults to current year)',
      example: 2025,
    }),
    ApiResponse({
      status: 200,
      description: 'Dashboard analytics fetched successfully',
      schema: {
        type: 'object',
        properties: {
          status_code: { type: 'number', example: 200 },
          message: {
            type: 'string',
            example: 'Dashboard analytics fetched successfully',
          },
          data: {
            type: 'object',
            properties: {
              totals: {
                type: 'object',
                properties: {
                  total_expected_fees: { type: 'number', example: 8600000 },
                  total_paid: { type: 'number', example: 2000000 },
                  outstanding_balance: { type: 'number', example: 6600000 },
                  transaction_this_month: { type: 'number', example: 110 },
                },
              },
              monthly_payments: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    month: { type: 'string', example: 'Jan' },
                    total_payment: { type: 'number', example: 150000 },
                  },
                },
              },
            },
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Invalid query parameters',
      schema: {
        type: 'object',
        properties: {
          status_code: { type: 'number', example: 400 },
          message: { type: 'string', example: 'Invalid year parameter' },
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Internal server error',
      schema: {
        type: 'object',
        properties: {
          status_code: { type: 'number', example: 500 },
          message: { type: 'string', example: 'Internal server error' },
        },
      },
    }),
  );
}
