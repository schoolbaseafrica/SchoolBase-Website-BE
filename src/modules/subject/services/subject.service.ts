import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource, In } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../../constants/system.messages';
import {
  AcademicSession,
  SessionStatus,
} from '../../academic-session/entities/academic-session.entity';
import { AcademicSessionModelAction } from '../../academic-session/model-actions/academic-session-actions';
import { ClassSubject } from '../../class/entities/class-subject.entity';
import { Class } from '../../class/entities/class.entity';
import { AssignClassesToSubjectDto } from '../dto/assign-classes-to-subject.dto';
import { CreateSubjectDto } from '../dto/create-subject.dto';
import { SubjectResponseDto } from '../dto/subject-response.dto';
import { UpdateSubjectDto } from '../dto/update-subject.dto';
import { Subject } from '../entities/subject.entity';
import {
  IBaseResponse,
  IPaginatedResponse,
  IPaginationMeta,
  IAssignClassesToSubjectResponse,
} from '../interface/types';
import { SubjectModelAction } from '../model-actions/subject.actions';

@Injectable()
export class SubjectService {
  private readonly logger: Logger;

  constructor(
    private readonly subjectModelAction: SubjectModelAction,
    private readonly academicSessionModelAction: AcademicSessionModelAction,
    private readonly dataSource: DataSource,
    @Inject(WINSTON_MODULE_PROVIDER) baseLogger: Logger,
  ) {
    this.logger = baseLogger.child({ context: SubjectService.name });
  }

  //CREATE SUBJECT
  async create(
    createSubjectDto: CreateSubjectDto,
  ): Promise<IBaseResponse<SubjectResponseDto>> {
    return this.dataSource.transaction(async (manager) => {
      // Check if subject with same name exists
      const existingSubject = await this.subjectModelAction.get({
        identifierOptions: { name: createSubjectDto.name },
      });

      if (existingSubject) {
        throw new ConflictException(sysMsg.SUBJECT_ALREADY_EXISTS);
      }

      // Create subject
      const newSubject = await this.subjectModelAction.create({
        createPayload: {
          name: createSubjectDto.name,
        },
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });

      return {
        message: sysMsg.SUBJECT_CREATED,
        data: this.mapToResponseDto(newSubject),
      };
    });
  }

  // FIND ALL SUBJECTS
  async findAll(
    page = 1,
    limit = 20,
  ): Promise<IPaginatedResponse<SubjectResponseDto>> {
    const { payload, paginationMeta } = await this.subjectModelAction.list({
      paginationPayload: { page, limit },
    });

    const subjects = Object.values(payload).map((subject) =>
      this.mapToResponseDto(subject),
    );

    // Ensure pagination meta has all required fields
    const pagination: IPaginationMeta = {
      total: paginationMeta?.total ?? 0,
      page: paginationMeta?.page ?? page,
      limit: paginationMeta?.limit ?? limit,
      total_pages: paginationMeta?.total_pages,
      has_next: paginationMeta?.has_next,
      has_previous: paginationMeta?.has_previous,
    };

    return {
      message: sysMsg.SUBJECTS_RETRIEVED,
      data: subjects,
      pagination,
    };
  }

  // FIND SUBJECT BY ID
  async findOne(id: string): Promise<IBaseResponse<SubjectResponseDto>> {
    const subject = await this.subjectModelAction.get({
      identifierOptions: { id },
      relations: {
        classSubjects: {
          class: {
            academicSession: true,
          },
          teacher: true,
        },
      },
    });

    if (!subject) {
      throw new NotFoundException(sysMsg.SUBJECT_NOT_FOUND);
    }

    return {
      message: sysMsg.SUBJECT_RETRIEVED,
      data: this.mapToResponseDto(subject),
    };
  }

  // UPDATE SUBJECT
  async update(
    id: string,
    updateSubjectDto: UpdateSubjectDto,
  ): Promise<IBaseResponse<SubjectResponseDto>> {
    return this.dataSource.transaction(async (manager) => {
      // Check if subject exists
      const existingSubject = await this.subjectModelAction.get({
        identifierOptions: { id },
      });

      if (!existingSubject) {
        throw new NotFoundException(sysMsg.SUBJECT_NOT_FOUND);
      }

      // If name is being updated, check for conflicts
      if (
        updateSubjectDto.name &&
        updateSubjectDto.name !== existingSubject.name
      ) {
        const conflictingSubject = await this.subjectModelAction.get({
          identifierOptions: { name: updateSubjectDto.name },
        });

        if (conflictingSubject && conflictingSubject.id !== id) {
          throw new ConflictException(sysMsg.SUBJECT_ALREADY_EXISTS);
        }
      }

      // Update subject
      const updatedSubject = await this.subjectModelAction.update({
        identifierOptions: { id },
        updatePayload: {
          ...(updateSubjectDto.name && { name: updateSubjectDto.name }),
        },
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });

      return {
        message: sysMsg.SUBJECT_UPDATED,
        data: this.mapToResponseDto(updatedSubject),
      };
    });
  }

  // DELETE SUBJECT
  async remove(id: string): Promise<IBaseResponse<void>> {
    return this.dataSource.transaction(async (manager) => {
      // Check if subject exists
      const existingSubject = await this.subjectModelAction.get({
        identifierOptions: { id },
      });

      if (!existingSubject) {
        throw new NotFoundException(sysMsg.SUBJECT_NOT_FOUND);
      }

      // Delete subject
      await this.subjectModelAction.delete({
        identifierOptions: { id },
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });

      return {
        message: sysMsg.SUBJECT_DELETED,
        data: undefined,
      };
    });
  }

  /**
   * Fetches the active academic session entity.
   */
  private async getActiveSession(): Promise<AcademicSession> {
    const { payload } = await this.academicSessionModelAction.list({
      filterRecordOptions: { status: SessionStatus.ACTIVE },
    });
    if (!payload.length) throw new NotFoundException('No active session found');
    if (payload.length > 1)
      throw new ConflictException('Multiple active sessions found');
    return payload[0];
  }

  // ASSIGN CLASSES TO SUBJECT
  async assignClassesToSubject(
    subjectId: string,
    dto: AssignClassesToSubjectDto,
  ): Promise<IAssignClassesToSubjectResponse> {
    return this.dataSource.transaction(async (manager) => {
      // Check if subject exists
      const subject = await manager.findOne(Subject, {
        where: { id: subjectId },
      });
      if (!subject) throw new NotFoundException(sysMsg.SUBJECT_NOT_FOUND);

      // Get active session
      const activeSession = await this.getActiveSession();

      // Fetch all classes
      const classes = await manager.find(Class, {
        where: { id: In(dto.classIds) },
        relations: ['academicSession'],
      });
      if (classes.length !== dto.classIds.length)
        throw new NotFoundException(sysMsg.CLASS_NOT_FOUND);

      // Check if all classes are in the active session
      const invalidClasses = classes.filter(
        (cls) => cls.academicSession.id !== activeSession.id,
      );
      if (invalidClasses.length > 0) {
        throw new ConflictException(sysMsg.CLASSES_NOT_IN_ACTIVE_SESSION);
      }

      // Add new links, avoid duplicates
      for (const cls of classes) {
        const exists = await manager.findOne(ClassSubject, {
          where: { subject: { id: subjectId }, class: { id: cls.id } },
        });
        if (!exists) {
          const classSubject = manager.create(ClassSubject, {
            class: cls,
            subject,
          });
          await manager.save(ClassSubject, classSubject);
        }
      }

      return {
        message: sysMsg.CLASSES_ASSIGNED_TO_SUBJECT,
        id: subject.id,
        subjectId: subject.id,
        name: subject.name,
        classes: classes.map((cls) => ({
          id: cls.id,
          name: cls.name,
          arm: cls.arm,
          academicSession: {
            id: cls.academicSession.id,
            name: cls.academicSession.name,
          },
        })),
      };
    });
  }

  private mapToResponseDto(subject: Subject): SubjectResponseDto {
    const classes =
      subject.classSubjects?.map((classSubject) => ({
        id: classSubject.class.id,
        name: classSubject.class.name,
        arm: classSubject.class.arm,
        stream: classSubject.class.stream,
        academicSession: classSubject.class.academicSession
          ? {
              id: classSubject.class.academicSession.id,
              name: classSubject.class.academicSession.name,
            }
          : undefined,
        teacher_assignment_date: classSubject.teacher_assignment_date,
      })) || [];

    return {
      id: subject.id,
      name: subject.name,
      created_at: subject.createdAt,
      updated_at: subject.updatedAt,
      classes: classes.length > 0 ? classes : undefined,
    };
  }
}
