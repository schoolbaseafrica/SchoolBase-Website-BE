import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { In } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../../constants/system.messages';
import { DepartmentModelAction } from '../../department/model-actions/department.actions';
import { CreateSubjectDto } from '../dto/create-subject.dto';
import { SubjectResponseDto } from '../dto/subject-response.dto';
import { Subject } from '../entities/subject.entity';
import { IBaseResponse } from '../interface/types';
import { SubjectModelAction } from '../model-actions/subject.actions';

@Injectable()
export class SubjectService {
  private readonly logger: Logger;

  constructor(
    private readonly subjectModelAction: SubjectModelAction,
    private readonly departmentModelAction: DepartmentModelAction,
    @Inject(WINSTON_MODULE_PROVIDER) baseLogger: Logger,
  ) {
    this.logger = baseLogger.child({ context: SubjectService.name });
  }

  //CREATE SUBJECT
  async create(
    createSubjectDto: CreateSubjectDto,
  ): Promise<IBaseResponse<SubjectResponseDto>> {
    // Check if subject with same name exists
    const existingSubject = await this.subjectModelAction.get({
      identifierOptions: { name: createSubjectDto.name },
    });

    if (existingSubject) {
      throw new ConflictException(sysMsg.SUBJECT_ALREADY_EXISTS);
    }

    // Validate that all departments exist
    const departments = await this.departmentModelAction.list({
      filterRecordOptions: {
        id: In(createSubjectDto.departmentIds),
      },
    });

    if (departments.payload.length !== createSubjectDto.departmentIds.length) {
      throw new NotFoundException(sysMsg.DEPARTMENTS_NOT_FOUND);
    }

    // Create subject with departments
    const newSubject = await this.subjectModelAction.create({
      createPayload: {
        name: createSubjectDto.name,
        departments: departments.payload,
      },
      transactionOptions: {
        useTransaction: false,
      },
    });

    // Construct response directly from newSubject and departments already in memory
    // This avoids an unnecessary database query
    const subjectWithRelations: Subject = {
      ...newSubject,
      departments: departments.payload,
    };

    return {
      message: sysMsg.SUBJECT_CREATED,
      data: this.mapToResponseDto(subjectWithRelations),
    };
  }

  private mapToResponseDto(subject: Subject): SubjectResponseDto {
    return {
      id: subject.id,
      name: subject.name,
      departments: (subject.departments || []).map((dept) => ({
        id: dept.id,
        name: dept.name,
        created_at: dept.createdAt,
        updated_at: dept.updatedAt,
      })),
      created_at: subject.createdAt,
      updated_at: subject.updatedAt,
    };
  }
}
