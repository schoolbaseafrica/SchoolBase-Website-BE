import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';

import { AcademicSessionSwagger } from './academic-session.swagger';

export const DocsCreateAcademicSession = () => {
  const { operation, responses } = AcademicSessionSwagger.endpoints.create;
  return applyDecorators(
    ApiOperation(operation),
    ApiCreatedResponse(responses.created),
    ApiBadRequestResponse(responses.badRequest),
    ApiConflictResponse(responses.conflict),
  );
};

export const DocsGetAllAcademicSessions = () => {
  const { operation, responses } = AcademicSessionSwagger.endpoints.findAll;
  return applyDecorators(ApiOperation(operation), ApiOkResponse(responses.ok));
};

export const DocsGetAcademicSessionById = () => {
  const { operation, parameters, responses } =
    AcademicSessionSwagger.endpoints.findOne;
  return applyDecorators(
    ApiOperation(operation),
    ApiParam(parameters.id),
    ApiOkResponse(responses.ok),
    ApiNotFoundResponse(responses.notFound),
  );
};

export const DocsUpdateAcademicSession = () => {
  const { operation, parameters, responses } =
    AcademicSessionSwagger.endpoints.update;
  return applyDecorators(
    ApiOperation(operation),
    ApiParam(parameters.id),
    ApiOkResponse(responses.ok),
    ApiBadRequestResponse(responses.badRequest),
    ApiNotFoundResponse(responses.notFound),
  );
};

export const DocsDeleteAcademicSession = () => {
  const { operation, parameters, responses } =
    AcademicSessionSwagger.endpoints.remove;
  return applyDecorators(
    ApiOperation(operation),
    ApiParam(parameters.id),
    ApiOkResponse(responses.ok),
    ApiNotFoundResponse(responses.notFound),
  );
};

export const DocsGetActiveAcademicSession = () => {
  const { operation, responses } =
    AcademicSessionSwagger.endpoints.activeSession;
  return applyDecorators(
    ApiOperation(operation),
    ApiOkResponse(responses.ok),
    ApiNotFoundResponse(responses.notFound),
  );
};
