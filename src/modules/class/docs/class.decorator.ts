import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiCreatedResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';

import { ClassSwagger } from './class.swagger';

export const DocsGetClassTeachers = () => {
  const { operation, parameters, responses } =
    ClassSwagger.endpoints.getTeachers;

  return applyDecorators(
    ApiOperation(operation),
    ApiParam(parameters.id),
    ApiOkResponse(responses.ok),
    ApiNotFoundResponse(responses.notFound),
  );
};

export const DocsCreateClass = () => {
  const { operation, responses } = ClassSwagger.endpoints.createClass;

  return applyDecorators(
    ApiOperation(operation),
    ApiCreatedResponse(responses.created),
    ApiResponse(responses.badRequest),
    ApiNotFoundResponse(responses.notFound),
    ApiResponse(responses.conflict),
  );
};

export const DocsUpdateClass = () => {
  const { operation, parameters, responses } =
    ClassSwagger.endpoints.updateClass;

  return applyDecorators(
    ApiOperation(operation),
    ApiParam(parameters.id),
    ApiResponse(responses.ok),
    ApiResponse(responses.badRequest),
    ApiNotFoundResponse(responses.notFound),
    ApiResponse(responses.conflict),
  );
};

export const DocsGetGroupedClasses = () => {
  const { operation, parameters, responses } =
    ClassSwagger.endpoints.getGroupedClasses;
  return applyDecorators(
    ApiOperation(operation),
    ApiQuery(parameters.page),
    ApiQuery(parameters.limit),
    ApiOkResponse(responses.ok),
  );
};

export const DocsGetClassById = () => {
  const { operation, parameters, responses } =
    ClassSwagger.endpoints.getClassById;
  return applyDecorators(
    ApiOperation(operation),
    ApiParam(parameters.id),
    ApiResponse(responses.ok),
    ApiNotFoundResponse(responses.notFound),
  );
};

export const DocsGetTotalClasses = () => {
  const { operation, parameters, responses } =
    ClassSwagger.endpoints.getTotalClasses;
  return applyDecorators(
    ApiOperation(operation),
    ApiQuery(parameters.sessionId),
    ApiQuery(parameters.name),
    ApiQuery(parameters.arm),
    ApiResponse(responses.ok),
  );
};

export const DocsDeleteClass = () => {
  const { operation, parameters, responses } =
    ClassSwagger.endpoints.deleteClass;

  return applyDecorators(
    ApiOperation(operation),
    ApiParam(parameters.id),
    ApiResponse(responses.ok),
    ApiResponse(responses.badRequest),
    ApiNotFoundResponse(responses.notFound),
  );
};

export const DocsAssignSingleStudent = () => {
  const { operation, parameters, responses } =
    ClassSwagger.endpoints.assignSingleStudent;

  return applyDecorators(
    ApiOperation(operation),
    ApiParam(parameters.id),
    ApiParam(parameters.studentId),
    ApiOkResponse(responses.ok),
    ApiNotFoundResponse(responses.notFound),
    ApiConflictResponse(responses.conflict),
  );
};

export const DocsAssignStudents = () => {
  const { operation, parameters, responses } =
    ClassSwagger.endpoints.assignStudents;

  return applyDecorators(
    ApiOperation(operation),
    ApiParam(parameters.id),
    ApiOkResponse(responses.ok),
    ApiNotFoundResponse(responses.notFound),
    ApiConflictResponse(responses.conflict),
    ApiResponse(responses.badRequest),
  );
};

export const DocsGetClassStudents = () => {
  const { operation, parameters, responses } =
    ClassSwagger.endpoints.getStudents;

  return applyDecorators(
    ApiOperation(operation),
    ApiParam(parameters.id),
    ApiOkResponse(responses.ok),
    ApiNotFoundResponse(responses.notFound),
  );
};

export const DocsGetTeacherClasses = () => {
  const { operation, parameters, responses } =
    ClassSwagger.endpoints.getTeacherClasses;

  return applyDecorators(
    ApiOperation(operation),
    ApiQuery(parameters.sessionId),
    ApiOkResponse(responses.ok),
    ApiResponse(responses.badRequest),
  );
};
