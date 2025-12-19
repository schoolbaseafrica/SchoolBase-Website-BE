import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import * as sysMsg from '../../../constants/system.messages';
import { ContactResponseDto } from '../dto/contact-response.dto';

/**
 * Swagger decorators for Contact endpoints
 */
export const ApiContactTags = () => applyDecorators(ApiTags('Contact'));

/**
 * Swagger decorators for Create Contact endpoint
 */
export const ApiCreateContact = () =>
  applyDecorators(
    ApiOperation({ summary: 'Submit a contact inquiry' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: sysMsg.CONTACT_MESSAGE_SENT,
      type: ContactResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: sysMsg.VALIDATION_ERROR,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: sysMsg.OPERATION_FAILED,
    }),
    ApiResponse({
      status: HttpStatus.TOO_MANY_REQUESTS,
      description: sysMsg.TOO_MANY_REQUESTS,
    }),
  );
