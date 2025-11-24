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

import { ApiSuccessResponseDto } from '../../../common/dto/response.dto';
import {
  CLASS_CREATED,
  CLASS_OR_CLASS_STREAM_ALREADY_EXIST,
  SESSION_NOT_FOUND,
} from '../../../constants/system.messages';
import { AcademicSessionModelAction } from '../../academic-session/model-actions/academic-session-actions';
import { Stream } from '../../stream/entities/stream.entity';
import { CreateClassDto } from '../dto/create-class.dto';
import { TeacherAssignmentResponseDto } from '../dto/teacher-response.dto';
import { ClassTeacherModelAction } from '../model-actions/class-teacher.action';
import { ClassModelAction } from '../model-actions/class.actions';

@Injectable()
export class ClassService {
  private readonly logger: Logger;
  constructor(
    private readonly dataSource: DataSource,
    private readonly classModelAction: ClassModelAction,
    private readonly sessionModelAction: AcademicSessionModelAction,
    private readonly classTeacherModelAction: ClassTeacherModelAction,
    @Inject(WINSTON_MODULE_PROVIDER) baseLogger: Logger,
  ) {
    this.logger = baseLogger.child({ context: ClassService.name });
  }

  /**
   * Fetches teachers for a specific class and session.
   */
  async getTeachersByClass(
    classId: string,
    sessionId?: string,
  ): Promise<TeacherAssignmentResponseDto[]> {
    const classExist = await this.classModelAction.get({
      identifierOptions: { id: classId },
    });

    if (!classExist) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    // 2. Handle Session Logic (Default to active if null)
    const target_session = sessionId || (await this.getActiveSession());

    // 3. Fetch Assignments with Relations
    // We join 'class' here to access the 'stream' property
    const assignments = await this.classTeacherModelAction.list({
      filterRecordOptions: {
        class: { id: classId },
        session_id: target_session,
        is_active: true,
      },
      relations: {
        teacher: { user: true },
        class: { streams: true },
      },
    });

    // 4. Map to DTO
    return assignments.payload.map((assignment) => {
      const streamList: Stream[] = assignment.class.streams || [];
      const streamNames = streamList.map((s) => s.name).join(', ');
      return {
        teacher_id: assignment.teacher.id,
        name: assignment.teacher.user
          ? `${assignment.teacher.user.first_name} ${assignment.teacher.user.last_name}`
          : `Teacher ${assignment.teacher.employment_id}`,
        assignment_date: assignment.assignment_date,
        streams: streamNames,
      };
    });
  }

  async create(createClassDto: CreateClassDto) {
    const { name, stream, session_id } = createClassDto;

    const sessionExist = await this.sessionModelAction.get({
      identifierOptions: { id: session_id },
    });

    // Check if session exist
    if (!sessionExist) {
      throw new BadRequestException(SESSION_NOT_FOUND);
    }

    const normalizedName = name.trim().toLowerCase();
    const normalizedStream = stream ? stream.trim().toLowerCase() : null;

    // Check for existing class name/stream in session
    const { payload } = await this.classModelAction.find({
      findOptions: {
        normalized_name: normalizedName,
        normalized_stream: normalizedStream,
        session_id,
      },
      transactionOptions: {
        useTransaction: false,
      },
    });

    if (payload.length > 0) {
      throw new ConflictException(CLASS_OR_CLASS_STREAM_ALREADY_EXIST);
    }

    // Use transaction for atomic creation
    const createdClass = await this.dataSource.transaction(async (manager) => {
      const newClass = await this.classModelAction.create({
        createPayload: {
          name: name.trim(),
          session_id,
          stream,
          normalized_name: normalizedName,
          normalized_stream: normalizedStream,
        },
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });

      this.logger.info(CLASS_CREATED, newClass);
      return newClass;
    });

    return new ApiSuccessResponseDto(CLASS_CREATED, createdClass);
  }

  // Mock helper for active session
  private async getActiveSession(): Promise<string> {
    return '2024-2025';
  }
}
