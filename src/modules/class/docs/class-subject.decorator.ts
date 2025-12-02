import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';

import { ClassSubjectSwagger } from './class-subject.swagger';

export const DocsCreateClassSubjects = () => {
  const { operation, responses } = ClassSubjectSwagger.endpoints.create;

  return applyDecorators(
    ApiOperation(operation),
    ApiCreatedResponse(responses.created),
    ApiNotFoundResponse(responses.notFound),
    ApiBadRequestResponse(responses.badRequest),
  );
};

export const DocsListClassSubjects = () => {
  const { operation, responses } = ClassSubjectSwagger.endpoints.list;

  return applyDecorators(
    ApiOperation(operation),
    ApiOkResponse(responses.ok),
    ApiNotFoundResponse(responses.notFound),
  );
};

export const DocsAssignTeacherToSubject = () => {
  const { operation, parameters, responses } =
    ClassSubjectSwagger.endpoints.assignTeacherToClass;

  return applyDecorators(
    ApiOperation(operation),
    ApiParam(parameters.id),
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
    ApiParam(parameters.id),
    ApiNoContentResponse(responses.noContent),
    ApiResponse(responses.badRequest),
    ApiNotFoundResponse(responses.notFound),
  );
};
