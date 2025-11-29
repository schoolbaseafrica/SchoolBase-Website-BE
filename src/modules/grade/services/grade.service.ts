import { PaginationMeta } from '@hng-sdk/orm';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../../constants/system.messages';
import { Class, ClassSubject, ClassStudent } from '../../class/entities';
import { StudentModelAction } from '../../student/model-actions';
import {
  CreateGradeSubmissionDto,
  GradeResponseDto,
  GradeSubmissionResponseDto,
  ListGradeSubmissionsDto,
  UpdateGradeDto,
} from '../dto';
import {
  GradeSubmission,
  GradeSubmissionStatus,
} from '../entities/grade-submission.entity';
import { Grade } from '../entities/grade.entity';
import { GradeModelAction, GradeSubmissionModelAction } from '../model-actions';

@Injectable()
export class GradeService {
  private readonly logger: Logger;

  // Grading scale: A (80-100), B (70-79), C (60-69), D (50-59), E (40-49), F (0-39)
  private readonly gradingScale = [
    { min: 80, max: 100, grade: 'A' },
    { min: 70, max: 79, grade: 'B' },
    { min: 60, max: 69, grade: 'C' },
    { min: 50, max: 59, grade: 'D' },
    { min: 40, max: 49, grade: 'E' },
    { min: 0, max: 39, grade: 'F' },
  ];

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) baseLogger: Logger,
    private readonly gradeSubmissionModelAction: GradeSubmissionModelAction,
    private readonly gradeModelAction: GradeModelAction,
    private readonly studentModelAction: StudentModelAction,
    private readonly dataSource: DataSource,
  ) {
    this.logger = baseLogger.child({ context: GradeService.name });
  }

  /**
   * Calculate grade letter based on total score
   */
  private calculateGradeLetter(totalScore: number): string {
    for (const scale of this.gradingScale) {
      if (totalScore >= scale.min && totalScore <= scale.max) {
        return scale.grade;
      }
    }
    return 'F';
  }

  /**
   * Verify teacher is assigned to the subject/class
   */
  private async verifyTeacherSubjectAssignment(
    teacherId: string,
    subjectId: string,
    classId: string,
  ): Promise<boolean> {
    const classSubject = await this.dataSource
      .getRepository(ClassSubject)
      .findOne({
        where: {
          class: { id: classId },
          subject: { id: subjectId },
          teacher: { id: teacherId },
        },
      });

    return !!classSubject;
  }

  /**
   * Create a new grade submission (draft)
   */
  async createSubmission(
    teacherId: string,
    createDto: CreateGradeSubmissionDto,
  ): Promise<GradeSubmissionResponseDto> {
    // Verify teacher is assigned to this subject/class
    const isAssigned = await this.verifyTeacherSubjectAssignment(
      teacherId,
      createDto.subject_id,
      createDto.class_id,
    );

    if (!isAssigned) {
      this.logger.warn(
        `Teacher ${teacherId} not assigned to subject ${createDto.subject_id} for class ${createDto.class_id}`,
      );
      throw new ForbiddenException(sysMsg.GRADE_TEACHER_NOT_ASSIGNED);
    }

    // Check if a submission already exists for this combination
    const existingSubmission = await this.gradeSubmissionModelAction.get({
      identifierOptions: {
        teacher_id: teacherId,
        class_id: createDto.class_id,
        subject_id: createDto.subject_id,
        term_id: createDto.term_id,
        academic_session_id: createDto.academic_session_id,
      },
    });

    if (existingSubmission) {
      throw new BadRequestException(sysMsg.GRADE_SUBMISSION_EXISTS);
    }

    return this.dataSource.transaction(async (manager) => {
      // Create the submission
      const submission = await this.gradeSubmissionModelAction.create({
        createPayload: {
          teacher_id: teacherId,
          class_id: createDto.class_id,
          subject_id: createDto.subject_id,
          term_id: createDto.term_id,
          academic_session_id: createDto.academic_session_id,
          status: GradeSubmissionStatus.DRAFT,
        },
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });

      // Create individual grades for each student
      const grades: Grade[] = [];
      for (const studentGrade of createDto.grades) {
        const totalScore =
          studentGrade.ca_score && studentGrade.exam_score
            ? studentGrade.ca_score + studentGrade.exam_score
            : null;

        const gradeLetter = totalScore
          ? this.calculateGradeLetter(totalScore)
          : null;

        const grade = await this.gradeModelAction.create({
          createPayload: {
            submission_id: submission.id,
            student_id: studentGrade.student_id,
            ca_score: studentGrade.ca_score ?? null,
            exam_score: studentGrade.exam_score ?? null,
            total_score: totalScore,
            grade_letter: gradeLetter,
            comment: studentGrade.comment ?? null,
          },
          transactionOptions: {
            useTransaction: true,
            transaction: manager,
          },
        });
        grades.push(grade);
      }

      // Fetch the submission with all relations loaded using transaction manager
      const submissionWithRelations = await manager
        .getRepository(GradeSubmission)
        .findOne({
          where: { id: submission.id },
          relations: {
            teacher: { user: true },
            class: true,
            subject: true,
            term: true,
          },
        });

      // Fetch grades with student relations loaded using transaction manager
      const gradesWithRelations = await manager.getRepository(Grade).find({
        where: { submission_id: submission.id },
        relations: {
          student: { user: true },
        },
      });

      this.logger.info(sysMsg.GRADE_SUBMISSION_CREATED, {
        submissionId: submission.id,
        teacherId,
        classId: createDto.class_id,
        subjectId: createDto.subject_id,
        studentCount: grades.length,
      });

      return this.transformToResponse(
        submissionWithRelations || submission,
        gradesWithRelations || grades,
      );
    });
  }

  /**
   * Update a single grade within a submission
   */
  async updateGrade(
    teacherId: string,
    gradeId: string,
    updateDto: UpdateGradeDto,
  ): Promise<GradeResponseDto> {
    const grade = await this.gradeModelAction.get({
      identifierOptions: { id: gradeId },
      relations: { submission: true, student: { user: true } },
    });

    if (!grade) {
      throw new NotFoundException(sysMsg.GRADE_NOT_FOUND);
    }

    // Verify teacher owns this submission
    if (grade.submission.teacher_id !== teacherId) {
      throw new ForbiddenException(sysMsg.UNAUTHORIZED_GRADE_ACCESS);
    }

    // Check if submission is editable
    if (grade.submission.status === GradeSubmissionStatus.APPROVED) {
      throw new BadRequestException(sysMsg.GRADE_ALREADY_APPROVED);
    }

    if (grade.submission.status === GradeSubmissionStatus.SUBMITTED) {
      throw new BadRequestException(sysMsg.GRADE_ALREADY_SUBMITTED);
    }

    // Calculate new scores
    const caScore = updateDto.ca_score ?? grade.ca_score;
    const examScore = updateDto.exam_score ?? grade.exam_score;
    const totalScore =
      caScore !== null && examScore !== null ? caScore + examScore : null;
    const gradeLetter = totalScore
      ? this.calculateGradeLetter(totalScore)
      : null;

    const updatedGrade = await this.gradeModelAction.update({
      identifierOptions: { id: gradeId },
      updatePayload: {
        ca_score: caScore,
        exam_score: examScore,
        total_score: totalScore,
        grade_letter: gradeLetter,
        comment: updateDto.comment ?? grade.comment,
      },
      transactionOptions: { useTransaction: false },
    });

    this.logger.info(sysMsg.GRADE_UPDATED, {
      gradeId,
      teacherId,
      studentId: grade.student_id,
    });

    return this.transformGradeToResponse(updatedGrade, grade.student);
  }

  /**
   * Submit grades for admin approval
   */
  async submitForApproval(
    teacherId: string,
    submissionId: string,
  ): Promise<GradeSubmissionResponseDto> {
    const submission = await this.gradeSubmissionModelAction.get({
      identifierOptions: { id: submissionId },
      relations: {
        grades: { student: { user: true } },
        teacher: { user: true },
        class: true,
        subject: true,
        term: true,
      },
    });

    if (!submission) {
      throw new NotFoundException(sysMsg.GRADE_SUBMISSION_NOT_FOUND);
    }

    if (submission.teacher_id !== teacherId) {
      throw new ForbiddenException(sysMsg.UNAUTHORIZED_GRADE_ACCESS);
    }

    if (
      submission.status !== GradeSubmissionStatus.DRAFT &&
      submission.status !== GradeSubmissionStatus.REJECTED
    ) {
      throw new BadRequestException(sysMsg.GRADE_INVALID_STATUS_TRANSITION);
    }

    // Check all students have complete grades
    const incompleteGrades = submission.grades.filter(
      (g) => g.ca_score === null || g.exam_score === null,
    );

    if (incompleteGrades.length > 0) {
      throw new BadRequestException(sysMsg.GRADE_INCOMPLETE_SCORES);
    }

    const updatedSubmission = await this.gradeSubmissionModelAction.update({
      identifierOptions: { id: submissionId },
      updatePayload: {
        status: GradeSubmissionStatus.SUBMITTED,
        submitted_at: new Date(),
      },
      transactionOptions: { useTransaction: false },
    });

    this.logger.info(sysMsg.GRADE_SUBMITTED, {
      submissionId,
      teacherId,
      studentCount: submission.grades.length,
    });

    return this.transformToResponse(
      { ...submission, ...updatedSubmission },
      submission.grades,
    );
  }

  /**
   * Get a single submission by ID
   */
  async getSubmission(
    submissionId: string,
    teacherId?: string,
  ): Promise<GradeSubmissionResponseDto> {
    const submission = await this.gradeSubmissionModelAction.get({
      identifierOptions: { id: submissionId },
      relations: {
        grades: { student: { user: true } },
        teacher: { user: true },
        class: true,
        subject: true,
        term: true,
      },
    });

    if (!submission) {
      throw new NotFoundException(sysMsg.GRADE_SUBMISSION_NOT_FOUND);
    }

    // If teacherId provided, verify ownership
    if (teacherId && submission.teacher_id !== teacherId) {
      throw new ForbiddenException(sysMsg.UNAUTHORIZED_GRADE_ACCESS);
    }

    return this.transformToResponse(submission, submission.grades);
  }

  /**
   * List teacher's submissions
   */
  async listTeacherSubmissions(
    teacherId: string,
    listDto: ListGradeSubmissionsDto,
  ): Promise<{
    data: GradeSubmissionResponseDto[];
    meta: Partial<PaginationMeta>;
  }> {
    const {
      page = 1,
      limit = 10,
      class_id,
      subject_id,
      term_id,
      status,
    } = listDto;

    const filterOptions: Record<string, unknown> = { teacher_id: teacherId };
    if (class_id) filterOptions.class_id = class_id;
    if (subject_id) filterOptions.subject_id = subject_id;
    if (term_id) filterOptions.term_id = term_id;
    if (status) filterOptions.status = status;

    const result = await this.gradeSubmissionModelAction.list({
      filterRecordOptions: filterOptions,
      relations: {
        grades: { student: { user: true } },
        teacher: { user: true },
        class: true,
        subject: true,
        term: true,
      },
      paginationPayload: { page, limit },
      order: { createdAt: 'DESC' },
    });

    const data = result.payload.map((submission) =>
      this.transformToResponse(submission, submission.grades),
    );

    return { data, meta: result.paginationMeta };
  }

  /**
   * Get students for a class (for grade entry)
   * Queries students through ClassStudent relationship
   */
  async getStudentsForClass(
    classId: string,
    teacherId: string,
    subjectId: string,
  ): Promise<{ id: string; name: string; registration_number: string }[]> {
    // Verify teacher is assigned to this subject/class
    const isAssigned = await this.verifyTeacherSubjectAssignment(
      teacherId,
      subjectId,
      classId,
    );

    if (!isAssigned) {
      throw new ForbiddenException(sysMsg.GRADE_TEACHER_NOT_ASSIGNED);
    }

    // Get the class to verify it exists
    const classEntity = await this.dataSource
      .getRepository(Class)
      .findOne({ where: { id: classId } });

    if (!classEntity) {
      throw new NotFoundException(sysMsg.CLASS_NOT_FOUND);
    }

    // Query students through ClassStudent relationship
    const classStudents = await this.dataSource
      .getRepository(ClassStudent)
      .createQueryBuilder('classStudent')
      .leftJoinAndSelect('classStudent.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .where('classStudent.class.id = :classId', { classId })
      .andWhere('classStudent.is_active = :isActive', { isActive: true })
      .andWhere('student.is_deleted = :isDeleted', { isDeleted: false })
      .orderBy('user.last_name', 'ASC')
      .addOrderBy('user.first_name', 'ASC')
      .getMany();

    return classStudents.map((cs) => ({
      id: cs.student.id,
      name: `${cs.student.user.first_name} ${cs.student.user.last_name}`,
      registration_number: cs.student.registration_number,
    }));
  }

  /**
   * Transform submission to response DTO
   */
  private transformToResponse(
    submission: GradeSubmission,
    grades: Grade[],
  ): GradeSubmissionResponseDto {
    return {
      id: submission.id,
      teacher: submission.teacher
        ? {
            id: submission.teacher.id,
            name: `${submission.teacher.user?.first_name || ''} ${submission.teacher.user?.last_name || ''}`.trim(),
            title: submission.teacher.title,
          }
        : null,
      class: submission.class
        ? {
            id: submission.class.id,
            name: submission.class.name,
            arm: submission.class.arm,
          }
        : null,
      subject: submission.subject
        ? {
            id: submission.subject.id,
            name: submission.subject.name,
          }
        : null,
      term: submission.term
        ? {
            id: submission.term.id,
            name: submission.term.name,
          }
        : null,
      status: submission.status,
      student_count: grades.length,
      submitted_at: submission.submitted_at,
      reviewed_at: submission.reviewed_at,
      rejection_reason: submission.rejection_reason,
      grades: grades.map((grade) =>
        this.transformGradeToResponse(grade, grade.student),
      ),
      created_at: submission.createdAt,
      updated_at: submission.updatedAt,
    } as GradeSubmissionResponseDto;
  }

  /**
   * Transform grade to response DTO
   */
  private transformGradeToResponse(
    grade: Grade,
    student: Grade['student'] | null,
  ): GradeResponseDto {
    return {
      id: grade.id,
      student: student
        ? {
            id: student.id,
            name: `${student.user?.first_name || ''} ${student.user?.last_name || ''}`.trim(),
            registration_number: student.registration_number,
          }
        : null,
      ca_score: grade.ca_score,
      exam_score: grade.exam_score,
      total_score: grade.total_score,
      grade_letter: grade.grade_letter,
      comment: grade.comment,
    } as GradeResponseDto;
  }
}
