import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

import { StudentSwagger } from './student.swagger';

export const DeleteStudentDocs = () => {
  const { operation, responses } = StudentSwagger.endpoints.delete;

  return applyDecorators(
    ApiOperation(operation),
    ApiOkResponse(responses.ok),
    ApiBadRequestResponse(responses.badRequest),
    ApiNotFoundResponse(responses.notFound),
    ApiBearerAuth(),
  );
};
