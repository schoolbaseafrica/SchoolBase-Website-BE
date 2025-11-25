import {
  applyDecorators,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';

import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../shared/enums';
import { StudentSwagger } from '../docs';

export const CreateStudentDecorator = () => {
  const { operation, responses } = StudentSwagger.endpoints.create;

  return applyDecorators(
    ApiOperation(operation),
    ApiCreatedResponse(responses.created),
    ApiBadRequestResponse(responses.badRequest),
    ApiConflictResponse(responses.conflict),
    Roles(UserRole.ADMIN),
    UseGuards(JwtAuthGuard, RolesGuard),
    HttpCode(HttpStatus.CREATED),
  );
};
