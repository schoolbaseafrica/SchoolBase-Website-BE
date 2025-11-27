import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../../constants/system.messages';
import { CreateSubjectDto } from '../dto/create-subject.dto';
import { SubjectResponseDto } from '../dto/subject-response.dto';
import { Subject } from '../entities/subject.entity';
import {
  IBaseResponse,
  IPaginatedResponse,
  IPaginationMeta,
} from '../interface/types';
import { SubjectModelAction } from '../model-actions/subject.actions';

@Injectable()
export class SubjectService {
  private readonly logger: Logger;

  constructor(
    private readonly subjectModelAction: SubjectModelAction,
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
    });

    if (!subject) {
      throw new NotFoundException(sysMsg.SUBJECT_NOT_FOUND);
    }

    return {
      message: sysMsg.SUBJECT_RETRIEVED,
      data: this.mapToResponseDto(subject),
    };
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

  private mapToResponseDto(subject: Subject): SubjectResponseDto {
    return {
      id: subject.id,
      name: subject.name,
      created_at: subject.createdAt,
      updated_at: subject.updatedAt,
    };
  }
}
