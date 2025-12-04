import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { DayOfWeek } from '../enums/timetable.enums';

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

export const GetAllTimetableDocs = () => {
  const { operation, responses } = TimetableSwagger.endpoints.findAll;

  return applyDecorators(
    ApiOperation(operation),
    ApiOkResponse(responses.ok),
    ApiNotFoundResponse(responses.notFound),
    ApiBearerAuth(),

    ApiQuery({ name: 'page', required: false, type: Number }),
    ApiQuery({ name: 'limit', required: false, type: Number }),
    ApiQuery({
      name: 'day',
      required: false,
      enum: DayOfWeek, // 👈 restricts values to MONDAY–SUNDAY in Swagger
      description: 'Filter schedules by day of the week',
    }),
  );
};
