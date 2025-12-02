import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

import * as sysMsg from '../../../constants/system.messages';
import {
  CreateGradeSubmissionDto,
  GradeResponseDto,
  GradeSubmissionResponseDto,
  ListGradeSubmissionsResponseDto,
  UpdateGradeDto,
} from '../dto';
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

export function listGradeSubmissionsDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'List grade submissions (ADMIN/TEACHER)',
      description:
        'Get all grade submissions, Only gets submissions for authenticated teacher if authenticated user is a teacher',
    }),
    ApiResponse({
      status: 200,
      description: 'List of grade submissions',
      type: ListGradeSubmissionsResponseDto,
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

export function getStudentGradesDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get student grades',
      description: 'Retrieve all grades for a specific student.',
    }),
    ApiParam({
      name: 'studentId',
      type: String,
      description: 'The ID of the student to retrieve grades for.',
    }),
    ApiResponse({
      status: 200,
      description: 'Grades fetched successfully.',
      type: [GradeResponseDto],
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Not authorized to access these grades.',
    }),
    ApiResponse({
      status: 404,
      description: 'Student not found',
    }),
  );
}

export function approveSubmissionDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Approve a grade submission',
      description:
        'Approve a grade submission by Admin. All grades must be complete.',
    }),
    ApiOkResponse({
      description: sysMsg.GRADE_APPROVED,
    }),
    ApiBadRequestResponse({
      description: `${sysMsg.GRADE_ALREADY_APPROVED} || ${sysMsg.GRADE_ALREADY_REJECTED} || ${sysMsg.GRADE_NOT_SUBMITTED}`,
    }),
    ApiNotFoundResponse({
      description: sysMsg.GRADE_SUBMISSION_NOT_FOUND,
    }),
  );
}

export function rejectSubmissionDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Reject a grade submission',
      description:
        'Reject a grade submission by Admin. All grades must be complete.',
    }),
    ApiNotFoundResponse({
      description: sysMsg.GRADE_SUBMISSION_NOT_FOUND,
    }),
    ApiOkResponse({
      description: sysMsg.GRADE_REJECTED,
    }),
    ApiBadRequestResponse({
      description: `${sysMsg.GRADE_ALREADY_APPROVED} || ${sysMsg.GRADE_ALREADY_REJECTED} || ${sysMsg.GRADE_NOT_SUBMITTED}`,
    }),
  );
}
