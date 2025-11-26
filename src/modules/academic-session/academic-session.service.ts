import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource, FindOptionsOrder } from 'typeorm';

import * as sysMsg from '../../constants/system.messages';

import { CreateAcademicSessionDto } from './dto/create-academic-session.dto';
import { UpdateAcademicSessionDto } from './dto/update-academic-session.dto';
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

  private validateSessionIsModifiable(session: AcademicSession): void {
    if (session.status !== SessionStatus.ACTIVE) {
      throw new ForbiddenException(sysMsg.INACTIVE_SESSION_LOCKED);
    }
  }

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
      throw new BadRequestException(sysMsg.SESSION_NOT_FOUND);
    }

    const updatedAcademicSession = await this.dataSource.transaction(
      async (manager) => {
        // Deactivate all currently active sessions
        await this.sessionModelAction.update({
          updatePayload: { status: SessionStatus.INACTIVE },
          identifierOptions: { status: SessionStatus.ACTIVE },
          transactionOptions: {
            useTransaction: true,
            transaction: manager,
          },
        });

        const updateResult = await this.sessionModelAction.update({
          identifierOptions: { id: sessionId },
          updatePayload: { status: SessionStatus.ACTIVE },
          transactionOptions: {
            useTransaction: true,
            transaction: manager,
          },
        });
        if (!updateResult) {
          throw new BadRequestException(
            `Failed to activate session ${sessionId}. Session may have been deleted.`,
          );
        }

        // Fetch the updated session within the transaction
        const updated = await manager.findOne(AcademicSession, {
          where: { id: sessionId },
        });

        return updated;
      },
    );
    return {
      status_code: HttpStatus.OK,
      message: sysMsg.ACADEMY_SESSION_ACTIVATED,
      data: updatedAcademicSession,
    };
  }

  async findOne(id: string) {
    const session = await this.sessionModelAction.get({
      identifierOptions: { id },
    });

    if (!session) {
      throw new BadRequestException(sysMsg.SESSION_NOT_FOUND);
    }

    return {
      status_code: HttpStatus.OK,
      message: sysMsg.ACADEMIC_SESSION_RETRIEVED,
      data: session,
    };
  }

  async update(id: string, updateSessionDto: UpdateAcademicSessionDto) {
    const session = await this.sessionModelAction.get({
      identifierOptions: { id },
    });

    if (!session) {
      throw new BadRequestException(sysMsg.SESSION_NOT_FOUND);
    }

    // LOCK CHECK: Prevent modification of inactive sessions
    this.validateSessionIsModifiable(session);

    // Validate dates if provided
    if (updateSessionDto.startDate && updateSessionDto.endDate) {
      const start = new Date(updateSessionDto.startDate);
      const end = new Date(updateSessionDto.endDate);

      if (end <= start) {
        throw new BadRequestException(sysMsg.INVALID_DATE_RANGE);
      }
    }

    // Check for duplicate name if name is being updated
    if (updateSessionDto.name && updateSessionDto.name !== session.name) {
      const existingSession = await this.sessionModelAction.get({
        identifierOptions: { name: updateSessionDto.name },
      });

      if (existingSession) {
        throw new ConflictException(sysMsg.DUPLICATE_SESSION_NAME);
      }
    }

    const updatePayload: Partial<AcademicSession> = {};
    if (updateSessionDto.name) updatePayload.name = updateSessionDto.name;
    if (updateSessionDto.startDate)
      updatePayload.startDate = new Date(updateSessionDto.startDate);
    if (updateSessionDto.endDate)
      updatePayload.endDate = new Date(updateSessionDto.endDate);

    await this.sessionModelAction.update({
      identifierOptions: { id },
      updatePayload,
      transactionOptions: { useTransaction: false },
    });

    const updatedSession = await this.sessionModelAction.get({
      identifierOptions: { id },
    });

    return {
      status_code: HttpStatus.OK,
      message: sysMsg.ACADEMIC_SESSION_UPDATED,
      data: updatedSession,
    };
  }

  async remove(id: string) {
    const session = await this.sessionModelAction.get({
      identifierOptions: { id },
    });

    if (!session) {
      throw new BadRequestException(sysMsg.SESSION_NOT_FOUND);
    }

    // LOCK CHECK: Prevent deletion of inactive sessions (locked for historical data)
    if (session.status !== SessionStatus.ACTIVE) {
      throw new ForbiddenException(sysMsg.INACTIVE_SESSION_LOCKED);
    }

    await this.sessionModelAction.delete({
      identifierOptions: { id },
      transactionOptions: { useTransaction: false },
    });

    return {
      status_code: HttpStatus.OK,
      message: sysMsg.ACADEMIC_SESSION_DELETED,
      data: null,
    };
  }
}
