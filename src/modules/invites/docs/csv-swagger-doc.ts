import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';

export function csvUploadDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Upload CSV file for bulk invitations (Admin | Supper Admin)',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'CSV file containing invite data',
      type: 'multipart/form-data',
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'CSV uploaded successfully',
      schema: {
        type: 'object',
        properties: {
          status_code: { type: 'number', example: 200 },
          message: { type: 'string', example: 'CSV uploaded successfully' },
          file_key: {
            type: 'string',
            example: 'invites/1700000000-teachers.csv',
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'No file uploaded',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 400 },
          message: {
            type: 'string',
            example: 'No file uploaded. Please attach a CSV file.',
          },
          error: { type: 'string', example: 'Bad Request' },
        },
      },
    }),
  );
}
