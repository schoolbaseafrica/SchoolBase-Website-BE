import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

import { TimetableSwagger } from './timetable.swagger';

export const GetTimetableDocs = () => {
  const { operation, parameters, responses } =
    TimetableSwagger.endpoints.findByClass;

  return applyDecorators(
    ApiOperation(operation),
    ApiParam(parameters.classId),
    ApiOkResponse(responses.ok),
    ApiNotFoundResponse(responses.notFound),
    ApiBearerAuth(),
  );
};
