import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
} from '@nestjs/swagger';

import { AcademicSessionSwagger } from './academic-session.swagger';

export const DocsCreateAcademicSession = () => {
  const { operation, responses } = AcademicSessionSwagger.endpoints.create;
  return applyDecorators(
    ApiOperation(operation),
    ApiCreatedResponse(responses.created),
    ApiBadRequestResponse(responses.badRequest),
    ApiConflictResponse(responses.conflict),
  );
};
