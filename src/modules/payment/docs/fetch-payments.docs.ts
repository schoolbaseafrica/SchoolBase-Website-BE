import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

import { PaymentSortBy, SortOrder } from '../dto/get-all-payments.dto';

export function fetchAllPaymentsDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Fetch all fee payments with filtering and pagination',
      description:
        'Retrieves a paginated list of all fee payments. Supports complex filtering by student, fee, term, session, and search across names/IDs. Only for ADMIN role.',
    }),
    // ... all ApiQuery definitions remain the same ...
    ApiQuery({
      name: 'page',
      type: Number,
      required: false,
      description: 'Page number for pagination (default: 1)',
    }),
    ApiQuery({
      name: 'limit',
      type: Number,
      required: false,
      description: 'Number of items per page (default: 10)',
    }),
    ApiQuery({
      name: 'sort_by',
      enum: PaymentSortBy,
      required: false,
      description: 'Field to sort by',
    }),
    ApiQuery({
      name: 'sort_order',
      enum: SortOrder,
      required: false,
      description: 'Sort direction',
    }),
    ApiQuery({
      name: 'search',
      type: String,
      required: false,
      description: 'Search by student name, invoice number, or transaction ID',
    }),
    ApiQuery({
      name: 'student_id',
      type: String,
      format: 'uuid',
      required: false,
      description: 'Filter by specific student UUID',
    }),
    ApiQuery({
      name: 'fee_component_id',
      type: String,
      format: 'uuid',
      required: false,
      description: 'Filter by specific fee component UUID',
    }),
    ApiQuery({
      name: 'term_id',
      type: String,
      format: 'uuid',
      required: false,
      description: 'Filter by academic term UUID',
    }),
    ApiQuery({
      name: 'session_id',
      type: String,
      format: 'uuid',
      required: false,
      description: 'Filter by academic session UUID',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Payments fetched successfully',
      schema: {
        type: 'object',
        properties: {
          status_code: { type: 'number', example: HttpStatus.OK },
          message: {
            type: 'string',
            example: 'Fee payments retrieved successfully.',
          },
          payments: {
            type: 'array',
            items: { $ref: '#/components/schemas/PaymentResponseDto' },
          },
          total: { type: 'number', example: 50 },
          page: { type: 'number', example: 1 },
          limit: { type: 'number', example: 10 },
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden role' }),
  );
}
