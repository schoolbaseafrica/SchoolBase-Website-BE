import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

import { StudentSwagger } from './student.swagger';

export const UpdateStudentDocs = () => {
  const { operation, responses } = StudentSwagger.endpoints.update;

  return applyDecorators(
    ApiOperation(operation),
    ApiOkResponse(responses.ok),
    ApiBadRequestResponse(responses.badRequest),
    ApiConflictResponse(responses.conflict),
    ApiNotFoundResponse(responses.notFound),
    ApiBearerAuth(),
  );
};
