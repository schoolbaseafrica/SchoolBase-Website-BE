import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiOkResponse,
  ApiQuery,
  ApiParam,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

import * as sysMsg from '../../../constants/system.messages';
import {
  AssignClassesToSubjectDto,
  UnassignClassesToSubjectDto,
} from '../dto/assign-classes-to-subject.dto';
import { CreateSubjectDto } from '../dto/create-subject.dto';
import { SubjectResponseDto } from '../dto/subject-response.dto';
import { UpdateSubjectDto } from '../dto/update-subject.dto';

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

/**
 * Swagger decorators for Find One Subject endpoint
 */
export const ApiFindOneSubject = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get Subject by ID',
      description: 'Retrieves a single subject by its ID.',
    }),
    ApiParam({ name: 'id', description: 'Subject ID', type: String }),
    ApiOkResponse({
      description: sysMsg.SUBJECT_RETRIEVED,
      type: SubjectResponseDto,
    }),
    ApiNotFoundResponse({ description: sysMsg.SUBJECT_NOT_FOUND }),
  );

/**
 * Swagger decorators for Update Subject endpoint
 */
export const ApiUpdateSubject = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update Subject',
      description:
        'Updates an existing subject. Subject name must be unique if changed.',
    }),
    ApiParam({ name: 'id', description: 'Subject ID', type: String }),
    ApiBody({
      type: UpdateSubjectDto,
      description: 'Update subject payload',
      examples: {
        example1: {
          summary: 'Update Subject Name',
          value: {
            name: 'Advanced Biology',
          },
        },
      },
    }),
    ApiOkResponse({
      description: sysMsg.SUBJECT_UPDATED,
      type: SubjectResponseDto,
    }),
    ApiNotFoundResponse({ description: sysMsg.SUBJECT_NOT_FOUND }),
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
 * Swagger decorators for Delete Subject endpoint
 */
export const ApiDeleteSubject = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete Subject',
      description: 'Deletes a subject by its ID.',
    }),
    ApiParam({ name: 'id', description: 'Subject ID', type: String }),
    ApiOkResponse({
      description: sysMsg.SUBJECT_DELETED,
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: sysMsg.SUBJECT_DELETED,
          },
          data: {
            type: 'null',
          },
        },
      },
    }),
    ApiNotFoundResponse({ description: sysMsg.SUBJECT_NOT_FOUND }),
  );

/**
 * Swagger decorators for Assign Classes to Subject endpoint
 */
export const ApiAssignClassesToSubject = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Assign Classes to Subject',
      description: 'Assigns a subject to multiple classes by their IDs.',
    }),
    ApiParam({ name: 'subjectId', description: 'Subject ID', type: String }),
    ApiBody({
      type: AssignClassesToSubjectDto,
      description: 'Array of class IDs to assign the subject to',
      examples: {
        example1: {
          summary: 'Assign subject to classes',
          value: {
            classIds: [
              'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
              'b2c3d4e5-f6a1-8901-bcde-2345678901bc',
            ],
          },
        },
      },
    }),
    ApiOkResponse({
      description: 'Subject assigned to classes successfully.',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Classes successfully assigned to subject',
          },
          data: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: '1120adab-775c-4f30-a559-47cdac8d2767',
              },
              subjectId: {
                type: 'string',
                example: '1120adab-775c-4f30-a559-47cdac8d2767',
              },
              name: { type: 'string', example: 'Biology' },
              classes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      example: '2e45db57-2b08-453f-9a8b-e26f867cad91',
                    },
                    name: { type: 'string', example: 'JSS1' },
                    arm: { type: 'string', example: '' },
                  },
                },
              },
            },
          },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Subject or one or more classes not found.',
    }),
    ApiResponse({ status: 400, description: 'Invalid input data.' }),
  );

/**
 * Swagger decorators for Unassign Classes to Subject endpoint
 */
export const ApiUnassignClassesToSubject = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Unassign Classes to Subject',
      description: 'Unassigns a subject to multiple classes by their IDs.',
    }),
    ApiParam({ name: 'subjectId', description: 'Subject ID', type: String }),
    ApiBody({
      type: UnassignClassesToSubjectDto,
      description: 'Array of class IDs to unassign the subject to',
      examples: {
        example1: {
          summary: 'Unassign subject to classes',
          value: {
            classIds: [
              'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
              'b2c3d4e5-f6a1-8901-bcde-2345678901bc',
            ],
          },
        },
      },
    }),
    ApiOkResponse({
      description: 'Subject unassigned to classes successfully.',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Classes successfully unassigned to subject',
          },
          data: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: '1120adab-775c-4f30-a559-47cdac8d2767',
              },
              subjectId: {
                type: 'string',
                example: '1120adab-775c-4f30-a559-47cdac8d2767',
              },
              name: { type: 'string', example: 'Biology' },
              classes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      example: '2e45db57-2b08-453f-9a8b-e26f867cad91',
                    },
                    name: { type: 'string', example: 'JSS1' },
                    arm: { type: 'string', example: '' },
                  },
                },
              },
            },
          },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Subject or one or more classes not found.',
    }),
    ApiResponse({ status: 400, description: 'Invalid input data.' }),
  );
