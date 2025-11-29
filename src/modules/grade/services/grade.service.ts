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
import { ClassSubject } from '../../class/entities';
import { GradeResponseDto, UpdateGradeDto } from '../dto';
import { Grade, GradeSubmissionStatus } from '../entities';
import { GradeModelAction } from '../model-actions';

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
    private readonly gradeModelAction: GradeModelAction,
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
