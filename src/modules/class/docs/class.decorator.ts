import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiCreatedResponse,
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
