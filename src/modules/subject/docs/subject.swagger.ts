import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';

import * as sysMsg from '../../../constants/system.messages';
import { CreateSubjectDto } from '../dto/create-subject.dto';
import { SubjectResponseDto } from '../dto/subject-response.dto';

/**
 * Swagger documentation for Subject endpoints.
 *
 * @module Subject
 */

/**
 * Swagger decorators for Subject endpoints
 */
export const ApiSubjectTags = () => applyDecorators(ApiTags('Subject'));

export const ApiSubjectBearerAuth = () => applyDecorators(ApiBearerAuth());

/**
 * Swagger decorators for Create Subject endpoint
 */
export const ApiCreateSubject = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create Subject',
      description: 'Creates a new subject. Subject name must be unique.',
    }),
    ApiBody({
      type: CreateSubjectDto,
      description: 'Create subject payload',
      examples: {
        example1: {
          summary: 'Biology Subject',
          value: {
            name: 'Biology',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Subject created successfully.',
      type: SubjectResponseDto,
    }),
    ApiResponse({
      status: 409,
      description: 'Subject with this name already exists.',
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid input data.',
    }),
  );

/**
 * Swagger decorators for Find All Subjects endpoint
 */
export const ApiFindAllSubjects = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get All Subjects',
      description:
        'Retrieves the list of all subjects with pagination support. Use page and limit query parameters to control pagination.',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (default: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Number of records per page (default: 20)',
      example: 20,
    }),
    ApiOkResponse({
      description: sysMsg.SUBJECTS_RETRIEVED,
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: sysMsg.SUBJECTS_RETRIEVED,
          },
          data: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/SubjectResponseDto',
            },
          },
          pagination: {
            type: 'object',
            properties: {
              total: { type: 'number', example: 50 },
              page: { type: 'number', example: 1 },
              limit: { type: 'number', example: 20 },
              total_pages: { type: 'number', example: 3 },
              has_next: { type: 'boolean', example: true },
              has_previous: { type: 'boolean', example: false },
            },
          },
        },
      },
    }),
  );
