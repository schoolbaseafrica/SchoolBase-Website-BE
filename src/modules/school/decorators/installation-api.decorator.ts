import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';

export function installationApi() {
  return applyDecorators(
    HttpCode(HttpStatus.CREATED),
    ApiOperation({ summary: 'Complete school installation setup' }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Green Valley High School' },
          address: { type: 'string', example: '123 Main Street, Springfield' },
          email: { type: 'string', example: 'contact@greenvalleys.edu' },
          phone: { type: 'string', example: '+1234567890' },
          logo: { type: 'string', format: 'binary' },
          primary_color: { type: 'string', example: '#1E40AF' },
          secondary_color: { type: 'string', example: '#3B82F6' },
          accent_color: { type: 'string', example: '#60A5FA' },
        },
        required: ['name', 'address', 'email', 'phone'],
      },
    }),
  );
}
