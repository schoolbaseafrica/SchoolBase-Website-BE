import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

import {
  CreateGradeSubmissionDto,
  GradeResponseDto,
  GradeSubmissionResponseDto,
  UpdateGradeDto,
} from '../dto';
import { GradeSubmissionStatus } from '../entities/grade-submission.entity';

export const GradeSwagger = {
  tags: ['Grades'],
};

export function createGradeSubmissionDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Create grade submission (draft)',
      description:
        'Create a new grade submission for a class/subject/term. Grades are saved as draft.',
    }),
    ApiBody({ type: CreateGradeSubmissionDto }),
    ApiResponse({
      status: 201,
      description: 'Grade submission created successfully',
      type: GradeSubmissionResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - submission already exists or invalid data',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - teacher not assigned to this subject/class',
    }),
  );
}

export function listTeacherSubmissionsDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'List teacher submissions',
      description: 'Get all grade submissions for the authenticated teacher',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Items per page',
    }),
    ApiQuery({
      name: 'class_id',
      required: false,
      type: String,
      description: 'Filter by class ID',
    }),
    ApiQuery({
      name: 'subject_id',
      required: false,
      type: String,
      description: 'Filter by subject ID',
    }),
    ApiQuery({
      name: 'term_id',
      required: false,
      type: String,
      description: 'Filter by term ID',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: GradeSubmissionStatus,
      description: 'Filter by status',
    }),
    ApiResponse({
      status: 200,
      description: 'List of grade submissions',
    }),
  );
}

export function getSubmissionDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get submission details',
      description: 'Get a single grade submission with all student grades',
    }),
    ApiParam({
      name: 'id',
      type: String,
      description: 'Submission ID',
    }),
    ApiResponse({
      status: 200,
      description: 'Grade submission details',
      type: GradeSubmissionResponseDto,
    }),
    ApiResponse({
      status: 404,
      description: 'Submission not found',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - not authorized to view this submission',
    }),
  );
}

export function submitForApprovalDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Submit grades for approval',
      description:
        'Submit a draft grade submission for admin approval. All grades must be complete.',
    }),
    ApiParam({
      name: 'id',
      type: String,
      description: 'Submission ID',
    }),
    ApiResponse({
      status: 200,
      description: 'Grades submitted for approval',
      type: GradeSubmissionResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - incomplete grades or invalid status',
    }),
    ApiResponse({
      status: 404,
      description: 'Submission not found',
    }),
  );
}

export function updateGradeDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Update a student grade',
      description:
        'Update CA score, exam score, or comment for a single student grade. Only for DRAFT or REJECTED submissions.',
    }),
    ApiParam({
      name: 'gradeId',
      type: String,
      description: 'Grade ID',
    }),
    ApiBody({ type: UpdateGradeDto }),
    ApiResponse({
      status: 200,
      description: 'Grade updated successfully',
      type: GradeResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - submission is not editable',
    }),
    ApiResponse({
      status: 404,
      description: 'Grade not found',
    }),
  );
}

export function getStudentsForClassDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get students for grade entry',
      description:
        'Get list of students in a class for grade entry. Teacher must be assigned to the subject.',
    }),
    ApiParam({
      name: 'classId',
      type: String,
      description: 'Class ID',
    }),
    ApiQuery({
      name: 'subject_id',
      required: true,
      type: String,
      description: 'Subject ID',
    }),
    ApiResponse({
      status: 200,
      description: 'List of students',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            registration_number: { type: 'string' },
          },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - teacher not assigned to this subject/class',
    }),
  );
}
