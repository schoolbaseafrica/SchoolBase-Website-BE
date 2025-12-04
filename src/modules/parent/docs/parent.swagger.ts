import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

import {
  CreateParentDto,
  LinkStudentsDto,
  ParentResponseDto,
  ParentStudentLinkResponseDto,
  UpdateParentDto,
  StudentSubjectResponseDto,
  StudentProfileDto,
} from '../dto';

const GLOBAL_STATUS_CODES = {
  OK: HttpStatus.OK,
  CREATED: HttpStatus.CREATED,
  UNAUTHORIZED: HttpStatus.UNAUTHORIZED,
  FORBIDDEN: HttpStatus.FORBIDDEN,
  CONFLICT: HttpStatus.CONFLICT,
};

/**
 * Swagger decorators for Parent endpoints
 */
export const ApiParentTags = () => applyDecorators(ApiTags('Parents'));

export const ApiParentBearerAuth = () => applyDecorators(ApiBearerAuth());

/**
 * Swagger decorators for Create Parent endpoint
 */
export const ApiCreateParent = () =>
  applyDecorators(
    ApiOperation({ summary: 'Create a new parent (ADMIN only)' }),
    ApiBody({ type: CreateParentDto }),
    ApiResponse({
      status: GLOBAL_STATUS_CODES.CREATED,
      description: 'Parent created successfully',
      type: ParentResponseDto,
    }),
    ApiResponse({
      status: GLOBAL_STATUS_CODES.CONFLICT,
      description: 'Email already exists',
    }),
  );

/**
 * Swagger decorators for Get Parent by ID endpoint
 */
export const ApiGetParent = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get a parent by ID (ADMIN only)' }),
    ApiParam({
      name: 'id',
      description: 'Parent ID (UUID)',
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: GLOBAL_STATUS_CODES.OK,
      description: 'Parent retrieved successfully',
      type: ParentResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Parent not found',
    }),
  );

/**
 * Swagger decorators for List Parents endpoint
 */
export const ApiListParents = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get all parents with pagination (ADMIN only)',
      description:
        'Retrieve a paginated list of all parents. Supports search by name or email.',
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
      description: 'Number of records per page (default: 10)',
      example: 10,
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Search term (searches in first name, last name, email)',
      example: 'John',
    }),
    ApiResponse({
      status: GLOBAL_STATUS_CODES.OK,
      description: 'Parents retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Parents fetched successfully',
          },
          status_code: {
            type: 'number',
            example: GLOBAL_STATUS_CODES.OK,
          },
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/ParentResponseDto' },
          },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'number', example: 1 },
              page: { type: 'number', example: 1 },
              limit: { type: 'number', example: 10 },
              totalPages: { type: 'number', example: 1 },
            },
          },
        },
      },
    }),
  );

/**
 * Swagger decorators for Update Parent endpoint
 */
export const ApiUpdateParent = () =>
  applyDecorators(
    ApiOperation({ summary: 'Update parent (partial, ADMIN only)' }),
    ApiParam({
      name: 'id',
      description: 'Parent ID (UUID)',
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiBody({ type: UpdateParentDto }),
    ApiResponse({
      status: GLOBAL_STATUS_CODES.OK,
      description: 'Parent updated successfully',
      type: ParentResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Parent not found',
    }),
    ApiResponse({
      status: GLOBAL_STATUS_CODES.CONFLICT,
      description: 'Email already exists for another user',
    }),
  );

/**
 * Swagger decorators for Delete Parent endpoint
 */
export const ApiDeleteParent = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete a parent (ADMIN only)',
      description:
        'Deletes a parent. The parent and associated user account will be deactivated.',
    }),
    ApiParam({
      name: 'id',
      description: 'Parent ID (UUID)',
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: GLOBAL_STATUS_CODES.OK,
      description: 'Parent deleted successfully',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'resource deleted',
          },
          status_code: {
            type: 'number',
            example: GLOBAL_STATUS_CODES.OK,
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Parent not found',
    }),
  );

/**
 * Swagger decorators for Link Students to Parent endpoint
 */
export const ApiLinkStudents = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Link one or more students to a parent (ADMIN only)',
      description:
        'Links students to a parent by updating the parent_id field in the student records. This operation is performed in a transaction to ensure data integrity.',
    }),
    ApiParam({
      name: 'parentId',
      description: 'Parent ID (UUID)',
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiBody({ type: LinkStudentsDto }),
    ApiResponse({
      status: GLOBAL_STATUS_CODES.CREATED,
      description: 'Students successfully linked to parent',
      type: ParentStudentLinkResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Parent or student not found',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid student IDs provided',
    }),
  );

/**
 * Swagger decorators for Get Linked Students endpoint
 */
export const ApiGetLinkedStudents = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get linked students for a parent (ADMIN only)',
      description:
        'Retrieves basic information for all students linked to a specific parent. Returns only non-deleted students.',
    }),
    ApiParam({
      name: 'parentId',
      description: 'Parent ID (UUID)',
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: GLOBAL_STATUS_CODES.OK,
      description: 'Linked students retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Parent students fetched successfully',
          },
          status_code: {
            type: 'number',
            example: GLOBAL_STATUS_CODES.OK,
          },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                registration_number: { type: 'string' },
                first_name: { type: 'string' },
                last_name: { type: 'string' },
                middle_name: { type: 'string' },
                full_name: { type: 'string' },
                photo_url: { type: 'string' },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Parent not found',
    }),
  );

/**
 * Swagger decorators for Get Student Subjects endpoint
 */
export const ApiGetStudentSubjects = () =>
  applyDecorators(
    ApiOperation({
      summary: "View child's subjects and teachers",
      description:
        "Retrieves all subjects and associated teachers for a student. Parents can only view their own children's subjects.",
    }),
    ApiParam({
      name: 'studentId',
      description: 'Student ID (UUID)',
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: GLOBAL_STATUS_CODES.OK,
      description: 'Subjects retrieved successfully',
      type: StudentSubjectResponseDto,
      isArray: true,
    }),
    ApiResponse({
      status: GLOBAL_STATUS_CODES.UNAUTHORIZED,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: GLOBAL_STATUS_CODES.FORBIDDEN,
      description: 'Forbidden - Parent accessing non-child student',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Student or Parent profile not found',
    }),
  );

/**
 * Swagger decorators for Get My Students endpoint (Parent Portal)
 */
export const ApiGetMyStudents = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get my linked students (PARENT only)',
      description:
        'Retrieves basic information for all students linked to the authenticated parent. Returns only non-deleted students.',
    }),
    ApiResponse({
      status: 200,
      description: 'Linked students retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Parent students fetched successfully',
          },
          status_code: {
            type: 'number',
            example: 200,
          },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                registration_number: { type: 'string' },
                first_name: { type: 'string' },
                last_name: { type: 'string' },
                middle_name: { type: 'string' },
                full_name: { type: 'string' },
                photo_url: { type: 'string' },
              },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Parent not found' }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing token',
    }),
  );

/**
 * Swagger decorators for Unlink Student endpoint
 */
export const ApiUnlinkStudent = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Unlink a student from a parent (ADMIN only)',
      description: 'Removes the link between a student and a parent.',
    }),
    ApiParam({
      name: 'parentId',
      description: 'Parent ID (UUID)',
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiParam({
      name: 'studentId',
      description: 'Student ID (UUID)',
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    ApiResponse({
      status: 200,
      description: 'Student unlinked successfully',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Student successfully unlinked from parent',
          },
          status_code: {
            type: 'number',
            example: 200,
          },
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Parent or Student not found' }),
    ApiResponse({
      status: 400,
      description: 'Student is not linked to this parent',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing token',
    }),
  );

export const ApiGetLinkedStudentProfileForParent = () => {
  return applyDecorators(
    ApiOperation({
      summary: "Get a linked student's profile (for Parents)",
      description:
        'Allows a logged-in parent to retrieve the detailed profile of one of their linked students.',
    }),
    ApiParam({ name: 'studentId', type: 'string', format: 'uuid' }),
    ApiOkResponse({
      description: "Successfully retrieved student's profile.",
      type: StudentProfileDto,
    }),
    ApiForbiddenResponse({
      description: 'Forbidden. You are not authorized to view this profile.',
    }),
    ApiNotFoundResponse({
      description: 'Parent or Student not found.',
    }),
  );
};
