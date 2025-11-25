import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../../constants/system.messages';
import {
  AcademicSession,
  SessionStatus,
} from '../../academic-session/entities/academic-session.entity';
import { AcademicSessionModelAction } from '../../academic-session/model-actions/academic-session-actions';
import { Stream } from '../../stream/entities/stream.entity';
import { CreateClassDto, ClassResponseDto } from '../dto/create-class.dto';
import { TeacherAssignmentResponseDto } from '../dto/teacher-response.dto';
import { ClassTeacherModelAction } from '../model-actions/class-teacher.action';
import { ClassModelAction } from '../model-actions/class.actions';

export interface ICreateClassResponse {
  status_code: number;
  message: string;
  data: ClassResponseDto;
}

@Injectable()
export class ClassService {
  private readonly logger: Logger;
  constructor(
    private readonly classModelAction: ClassModelAction,
    private readonly classTeacherModelAction: ClassTeacherModelAction,
    private readonly academicSessionModelAction: AcademicSessionModelAction,
    private readonly dataSource: DataSource,
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
        session_id:
          typeof target_session === 'string'
            ? target_session
            : target_session.id,
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

  /**
   * Creates a class and links it to the active academic session.
   */
  async create(createClassDto: CreateClassDto): Promise<ICreateClassResponse> {
    const { name, arm } = createClassDto;

    // Fetch active academic session
    const academicSession = await this.getActiveSession();

    const { payload } = await this.classModelAction.find({
      findOptions: {
        name,
        arm,
        academicSession: { id: academicSession.id },
      },
      transactionOptions: {
        useTransaction: false,
      },
    });
    if (payload.length > 0) {
      throw new ConflictException(sysMsg.CLASS_ALREADY_EXIST);
    }

    // Use transaction for atomic creation
    const createdClass = await this.dataSource.transaction(async (manager) => {
      const newClass = await this.classModelAction.create({
        createPayload: {
          name,
          arm,
          academicSession,
        },
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });
      this.logger.info(sysMsg.CLASS_CREATED, newClass);
      return newClass;
    });

    return {
      status_code: HttpStatus.CREATED,
      message: sysMsg.CLASS_CREATED,
      data: {
        id: createdClass.id,
        name: createdClass.name,
        arm: createdClass.arm,
        academicSession: {
          id: academicSession.id,
          name: academicSession.name,
        },
      },
    };
  }

  /**
   * Fetches the active academic session entity.
   */
  private async getActiveSession(): Promise<AcademicSession> {
    const { payload } = await this.academicSessionModelAction.list({
      filterRecordOptions: { status: SessionStatus.ACTIVE },
    });
    if (!payload.length) throw new NotFoundException('No active session found');
    return payload[0];
  }
}
