import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

import { SchoolSwagger } from './school.swagger';

export const DocsGetSchoolDetails = () => {
  const { operation, responses } = SchoolSwagger.endpoints.getSchoolDetails;

  return applyDecorators(
    ApiOperation(operation),
    ApiOkResponse(responses.ok),
    ApiNotFoundResponse(responses.notFound),
  );
};
