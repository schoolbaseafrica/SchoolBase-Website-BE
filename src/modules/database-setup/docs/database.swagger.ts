import { HttpStatus, applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

import * as sysMsg from '../../../constants/system.messages';
import { ConfigureDatabaseDto } from '../dto/configure-database.dto';

export const CreateDatabaseDocs = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Create school database configuration',
      description:
        'This endpoint is used to create a new school database configuration. It is only accessible to super admins.',
    }),
    ApiBody({ type: ConfigureDatabaseDto }),
    ApiResponse({
      status: HttpStatus.OK,
      description: sysMsg.DATABASE_CREATED,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: sysMsg.VALIDATION_ERROR,
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: sysMsg.DATABASE_ALREADY_CONFIGURED,
    }),
  );

export const UpdateDatabaseDocs = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Update school database configuration',
      description:
        'This endpoint is used to update the school database configuration. It is only accessible to super admins.',
    }),
    ApiBody({ type: ConfigureDatabaseDto }),
    ApiResponse({
      status: HttpStatus.OK,
      description: sysMsg.DATABASE_CONFIGURATION_UPDATED,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: sysMsg.BAD_REQUEST,
    }),
  );
