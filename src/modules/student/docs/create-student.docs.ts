import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { StudentSwagger } from './student.swagger';

export const CreateStudentDocs = () => {
  const { operation, responses } = StudentSwagger.endpoints.create;

  return applyDecorators(
    ApiOperation(operation),
    ApiCreatedResponse(responses.created),
    ApiBadRequestResponse(responses.badRequest),
    ApiConflictResponse(responses.conflict),
    ApiBearerAuth(),
  );
};
