import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../../constants/system.messages';
import { TeacherModelAction } from '../../teacher/model-actions/teacher-actions';
import { ClassModelAction, ClassSubjectModelAction } from '../model-actions';

@Injectable()
export class ClassSubjectService {
  private readonly logger: Logger;
  constructor(
    private readonly classSubjectAction: ClassSubjectModelAction,
    private readonly classModelAction: ClassModelAction,
    private readonly teacherModelAction: TeacherModelAction,
    private readonly dataSource: DataSource,
    @Inject(WINSTON_MODULE_PROVIDER) baseLogger: Logger,
  ) {
    this.logger = baseLogger.child({ context: ClassSubjectService.name });
  }

  async list(classId: string) {
    const eClass = await this.classModelAction.get({
      identifierOptions: { id: classId },
    });
    if (!eClass) throw new NotFoundException(sysMsg.CLASS_NOT_FOUND);
    const { payload, paginationMeta } = await this.classSubjectAction.list({
      filterRecordOptions: {
        class: { id: classId },
      },
      relations: {
        subject: true,
        teacher: true,
      },
    });
    return {
      message: sysMsg.CLASS_SUBJECTS_FETCHED_SUCCESSFUL,
      payload,
      paginationMeta,
    };
  }

  async assignTeacher(classId: string, subjectId: string, teacherId: string) {
    const classSubject = await this.classSubjectAction.get({
      identifierOptions: {
        class: { id: classId },
        subject: { id: subjectId },
      },
      relations: {
        class: true,
        subject: true,
        teacher: true,
      },
    });
    if (!classSubject)
      throw new NotFoundException(sysMsg.CLASS_SUBJECT_NOT_FOUND);
    if (classSubject.teacher)
      throw new ConflictException(sysMsg.CLASS_SUBJECT_ALREADY_HAS_A_TEACHER);
    const teacher = await this.teacherModelAction.get({
      identifierOptions: { id: teacherId },
    });
    if (!teacher) throw new NotFoundException(sysMsg.TEACHER_NOT_FOUND);
    await this.classSubjectAction.update({
      identifierOptions: {
        class: { id: classId },
        subject: { id: subjectId },
      },
      updatePayload: {
        teacher: { id: teacherId },
        teacher_assignment_date: new Date(),
      },
      transactionOptions: {
        useTransaction: false,
      },
    });
    return {
      message: sysMsg.TEACHER_ASSIGNED,
    };
  }

  async unassignTeacher(classId: string, subjectId: string) {
    const classSubject = await this.classSubjectAction.get({
      identifierOptions: {
        class: { id: classId },
        subject: { id: subjectId },
      },
      relations: {
        class: true,
        subject: true,
        teacher: true,
      },
    });
    if (!classSubject)
      throw new NotFoundException(sysMsg.CLASS_SUBJECT_NOT_FOUND);
    if (!classSubject.teacher)
      throw new BadRequestException(
        'No teacher assigned to this subject in this class',
      );
    await this.classSubjectAction.update({
      identifierOptions: {
        class: { id: classId },
        subject: { id: subjectId },
      },
      updatePayload: {
        teacher: null,
        teacher_assignment_date: null,
      },
      transactionOptions: {
        useTransaction: false,
      },
    });
    return {
      message: sysMsg.TEACHER_UNASSIGNED_FROM_SUBJECT,
    };
  }
}
