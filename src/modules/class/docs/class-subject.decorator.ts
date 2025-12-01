import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';

import { ClassSubjectSwagger } from './class-subject.swagger';

export const DocsListClassSubjects = () => {
  const { operation, parameters, responses } =
    ClassSubjectSwagger.endpoints.list;

  return applyDecorators(
    ApiOperation(operation),
    ApiParam(parameters.classId),
    ApiOkResponse(responses.ok),
    ApiNotFoundResponse(responses.notFound),
  );
};

export const DocsAssignTeacherToSubject = () => {
  const { operation, parameters, responses } =
    ClassSubjectSwagger.endpoints.assignTeacherToClass;

  return applyDecorators(
    ApiOperation(operation),
    ApiParam(parameters.classId),
    ApiParam(parameters.subjectId),
    ApiOkResponse(responses.ok),
    ApiNotFoundResponse(responses.notFound),
    ApiConflictResponse(responses.conflict),
  );
};

export const DocsUnassignTeacherFromSubject = () => {
  const { operation, parameters, responses } =
    ClassSubjectSwagger.endpoints.unassignTeacherFromClass;

  return applyDecorators(
    ApiOperation(operation),
    ApiParam(parameters.classId),
    ApiParam(parameters.subjectId),
    ApiOkResponse(responses.ok),
    ApiResponse(responses.badRequest),
    ApiNotFoundResponse(responses.notFound),
  );
};
