import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { DataSource, FindOptionsOrder } from 'typeorm';

import * as sysMsg from '../../constants/system.messages';

import { CreateAcademicSessionDto } from './dto/create-academic-session.dto';
import {
  AcademicSession,
  SessionStatus,
} from './entities/academic-session.entity';
import { AcademicSessionModelAction } from './model-actions/academic-session-actions';

export interface IListSessionsOptions {
  page?: number;
  limit?: number;
  order?: FindOptionsOrder<AcademicSession>;
}

export interface ICreateSessionResponse {
  status_code: HttpStatus;
  message: string;
  data: AcademicSession;
}
@Injectable()
export class AcademicSessionService {
  private readonly logger = new Logger(AcademicSessionService.name);
  constructor(
    private readonly sessionModelAction: AcademicSessionModelAction,
    private readonly dataSource: DataSource,
  ) {}
  async create(
    createSessionDto: CreateAcademicSessionDto,
  ): Promise<ICreateSessionResponse> {
    const existingSession = await this.sessionModelAction.get({
      identifierOptions: { name: createSessionDto.name },
    });

    if (existingSession) {
      throw new ConflictException(sysMsg.DUPLICATE_SESSION_NAME);
    }

    // Convert date strings to Date objects for comparison
    const start = new Date(createSessionDto.startDate);
    if (start < new Date()) {
      throw new BadRequestException(sysMsg.START_DATE_IN_PAST);
    }
    const end = new Date(createSessionDto.endDate);
    if (end < new Date()) {
      throw new BadRequestException(sysMsg.END_DATE_IN_PAST);
    }
    // 4. End date must be after start date.
    if (end <= start) {
      throw new BadRequestException(sysMsg.INVALID_DATE_RANGE);
    }
    const newSession = await this.sessionModelAction.create({
      createPayload: {
        name: createSessionDto.name,
        startDate: start,
        endDate: end,
      },
      transactionOptions: {
        useTransaction: false,
      },
    });
    return {
      status_code: HttpStatus.OK,
      message: sysMsg.ACADEMIC_SESSION_CREATED,
      data: newSession,
    };
  }

  async activeSessions() {
    const sessions = await this.sessionModelAction.list({
      filterRecordOptions: { status: SessionStatus.ACTIVE },
    });

    if (!sessions.payload.length) return null;

    if (sessions.payload.length > 1)
      throw new InternalServerErrorException(
        sysMsg.MULTIPLE_ACTIVE_ACADEMIC_SESSION,
      );

    return sessions.payload[0];
  }

  async findAll(options: IListSessionsOptions = {}) {
    const normalizedPage = Math.max(1, Math.floor(options.page ?? 1));
    const normalizedLimit = Math.max(1, Math.floor(options.limit ?? 20));

    const { payload, paginationMeta } = await this.sessionModelAction.list({
      order: options.order ?? { startDate: 'ASC' },
      paginationPayload: {
        page: normalizedPage,
        limit: normalizedLimit,
      },
    });

    return {
      status_code: HttpStatus.OK,
      message: sysMsg.ACADEMIC_SESSION_LIST_SUCCESS,
      data: payload,
      meta: paginationMeta,
    };
  }

  async activateSession(sessionId: string) {
    const session = await this.sessionModelAction.get({
      identifierOptions: { id: sessionId },
    });

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    const updatedAcademicSession = await this.dataSource.transaction(
      async (manager) => {
        const repository = manager.getRepository(AcademicSession);

        // 1. Deactivate all sessions using query builder
        await repository
          .createQueryBuilder()
          .update(AcademicSession)
          .set({ status: SessionStatus.INACTIVE })
          .execute();

        // 2. Activate selected session
        const updateResult = await manager.update(
          AcademicSession,
          { id: sessionId },
          { status: SessionStatus.ACTIVE },
        );

        if (updateResult?.affected === 0) {
          throw new BadRequestException(
            `Failed to activate session ${sessionId}. Session may have been deleted.`,
          );
        }

        // 3. Fetch updated session
        const updated = await repository.findOne({
          where: { id: sessionId },
        });

        if (!updated) {
          throw new InternalServerErrorException(
            `Session ${sessionId} was updated but could not be retrieved.`,
          );
        }
        return updated;
      },
    );
    return {
      status_code: HttpStatus.OK,
      message: sysMsg.ACADEMY_SESSION_ACTIVATED,
      data: updatedAcademicSession,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} academicSession`;
  }

  update(id: number) {
    return `This action updates a #${id} academicSession`;
  }

  remove(id: number) {
    return `This action removes a #${id} academicSession`;
  }
}
