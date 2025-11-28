import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

import { TimetableSwagger } from './timetable.swagger';

export const AddScheduleDocs = () => {
  const { operation, body, responses } = TimetableSwagger.endpoints.addSchedule;

  return applyDecorators(
    ApiOperation(operation),
    ApiBody(body),
    ApiCreatedResponse(responses.created),
    ApiBadRequestResponse(responses.badRequest),
    ApiNotFoundResponse(responses.notFound),
    ApiConflictResponse(responses.conflict),
    ApiBearerAuth(),
  );
};
