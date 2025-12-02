import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource, FindOptionsWhere, In } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../../constants/system.messages';
import { SubjectModelAction } from '../../subject/model-actions/subject.actions';
import { TeacherModelAction } from '../../teacher/model-actions/teacher-actions';
import {
  BulkCreateClassSubjectResponseDto,
  ListClassSubjectQueryDto,
} from '../dto';
import { ClassSubject } from '../entities';
import { ClassModelAction, ClassSubjectModelAction } from '../model-actions';

@Injectable()
export class ClassSubjectService {
  private readonly logger: Logger;
  constructor(
    private readonly classSubjectAction: ClassSubjectModelAction,
    private readonly classModelAction: ClassModelAction,
    private readonly teacherModelAction: TeacherModelAction,
    private readonly subjectModelAction: SubjectModelAction,
    private readonly dataSource: DataSource,
    @Inject(WINSTON_MODULE_PROVIDER) baseLogger: Logger,
  ) {
    this.logger = baseLogger.child({ context: ClassSubjectService.name });
  }

  async create(classId: string, subjectIds: string[]) {
    const {
      class: eClass,
      invalidSubjects,
      existingSubjects,
      newSubjects,
    } = await this.validateInputAndReturnData(classId, subjectIds);

    if (newSubjects.length === 0)
      return new BulkCreateClassSubjectResponseDto(
        sysMsg.CLASS_SUBJECTS_CREATED(0),
        newSubjects,
        existingSubjects,
        invalidSubjects,
      );

    await this.dataSource.transaction(async (manager) => {
      await this.classSubjectAction.createMany({
        createPayloads: newSubjects.map((subjectId) => ({
          class: eClass,
          subject: { id: subjectId },
        })),
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });
    });

    return new BulkCreateClassSubjectResponseDto(
      sysMsg.CLASS_SUBJECTS_CREATED(newSubjects.length),
      newSubjects,
      existingSubjects,
      invalidSubjects,
    );
  }

  async list(query: ListClassSubjectQueryDto) {
    const { class_id, subject_id, teacher_id, page, limit } = query;
    const filterOptions: FindOptionsWhere<ClassSubject> = {};
    if (class_id) filterOptions.class = { id: class_id };
    if (subject_id) filterOptions.subject = { id: subject_id };
    if (teacher_id) filterOptions.teacher = { id: teacher_id };
    const { payload, paginationMeta } = await this.classSubjectAction.list({
      filterRecordOptions: filterOptions,
      relations: {
        subject: true,
        teacher: true,
        class: true,
      },
      paginationPayload: {
        page,
        limit,
      },
    });
    return {
      message: sysMsg.CLASS_SUBJECTS_FETCHED_SUCCESSFUL,
      payload,
      paginationMeta,
    };
  }

  async assignTeacher(id: string, teacherId: string) {
    const classSubject = await this.classSubjectAction.get({
      identifierOptions: {
        id,
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
        id,
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

  async unassignTeacher(id: string) {
    const classSubject = await this.classSubjectAction.get({
      identifierOptions: {
        id,
      },
      relations: {
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
        id,
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

  private async validateInputAndReturnData(
    classId: string,
    subjectIds: string[],
  ) {
    const eClass = await this.classModelAction.get({
      identifierOptions: { id: classId },
    });
    if (!eClass || eClass.is_deleted)
      throw new NotFoundException(sysMsg.CLASS_NOT_FOUND);

    const subjects = await this.subjectModelAction.find({
      findOptions: {
        id: In(subjectIds),
      },
      transactionOptions: { useTransaction: false },
    });

    const foundSet = new Set(subjects.payload.map((s) => s.id));

    const validSubjects = subjectIds.filter((id) => foundSet.has(id));
    const invalidSubjects = subjectIds.filter((id) => !foundSet.has(id));

    const subjectsInClass = await this.classSubjectAction.list({
      filterRecordOptions: {
        class: { id: classId },
        subject: { id: In(validSubjects) },
      },
      relations: {
        subject: true,
      },
    });

    const classSubjectsSet = new Set(
      subjectsInClass.payload.map((s) => s.subject.id),
    );
    const existingSubjects = subjectIds.filter((id) =>
      classSubjectsSet.has(id),
    );

    const newSubjects = validSubjects.filter((id) => !classSubjectsSet.has(id));

    return {
      class: eClass,
      invalidSubjects,
      existingSubjects,
      newSubjects,
    };
  }
}
