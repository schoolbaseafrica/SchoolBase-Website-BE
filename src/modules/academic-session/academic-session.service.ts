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
import { TermService } from '../academic-term/term.service';

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
    private readonly termService: TermService,
  ) {}

  private validateSessionIsModifiable(session: AcademicSession): void {
    if (session.status !== SessionStatus.ACTIVE) {
      throw new ForbiddenException(sysMsg.INACTIVE_SESSION_LOCKED);
    }
  }

  async create(
    createSessionDto: CreateAcademicSessionDto,
  ): Promise<ICreateSessionResponse> {
    // Validate that exactly 3 terms are provided (enforced by DTO but double-check)
    if (createSessionDto.terms.length !== 3) {
      throw new BadRequestException('Exactly 3 terms are required.');
    }

    // Auto-assign term names based on array order: [0]=First, [1]=Second, [2]=Third
    const firstTerm = createSessionDto.terms[0];
    const secondTerm = createSessionDto.terms[1];
    const thirdTerm = createSessionDto.terms[2];

    if (!firstTerm || !thirdTerm) {
      throw new BadRequestException(
        'Both First term and Third terms are required.',
      );
    }

    // Session start date is first term start date, end date is third term end date
    const start = new Date(firstTerm.startDate);
    const end = new Date(thirdTerm.endDate);

    // Validate session dates
    if (start < new Date()) {
      throw new BadRequestException(sysMsg.START_DATE_IN_PAST);
    }
    if (end < new Date()) {
      throw new BadRequestException(sysMsg.END_DATE_IN_PAST);
    }
    if (end <= start) {
      throw new BadRequestException(sysMsg.INVALID_DATE_RANGE);
    }

    // Generate session name and academic year from start and end year
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    const sessionName = `${startYear}/${endYear}`;
    const academicYear = `${startYear}/${endYear}`;

    const existingSession = await this.sessionModelAction.get({
      identifierOptions: { name: sessionName },
    });

    if (existingSession) {
      throw new ConflictException(
        `Academic session ${sessionName} already exists.`,
      );
    }

    // Validate individual term dates
    for (let i = 0; i < createSessionDto.terms.length; i++) {
      const termDto = createSessionDto.terms[i];
      const termStart = new Date(termDto.startDate);
      const termEnd = new Date(termDto.endDate);

      if (termEnd <= termStart) {
        throw new BadRequestException(sysMsg.TERM_INVALID_DATE_RANGE);
      }
    }

    // Validate sequential term dates
    const firstTermEnd = new Date(firstTerm.endDate);
    const secondTermStart = new Date(secondTerm.startDate);
    const secondTermEnd = new Date(secondTerm.endDate);
    const thirdTermStart = new Date(thirdTerm.startDate);

    if (secondTermStart <= firstTermEnd) {
      throw new BadRequestException(sysMsg.TERM_SEQUENTIAL_INVALID);
    }

    if (thirdTermStart <= secondTermEnd) {
      throw new BadRequestException(sysMsg.TERM_SEQUENTIAL_INVALID);
    }

    // Use transaction to create session and terms together
    const newSession = await this.dataSource.transaction(async (manager) => {
      // Create the academic session
      const session = manager.create(AcademicSession, {
        name: sessionName,
        academicYear: academicYear,
        startDate: start,
        endDate: end,
        description: createSessionDto.description || null,
        status: SessionStatus.INACTIVE,
      });

      const savedSession = await manager.save(AcademicSession, session);

      // Create associated terms using TermService
      await this.termService.createTermsForSession(
        savedSession.id,
        createSessionDto.terms,
        manager,
      );

      // Fetch the complete session with terms
      const completeSession = await manager.findOne(AcademicSession, {
        where: { id: savedSession.id },
        relations: ['terms'],
      });

      return completeSession;
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

    const updatePayload: Partial<AcademicSession> = {};

    // Update description if provided
    if (updateSessionDto.description !== undefined) {
      updatePayload.description = updateSessionDto.description;
    }

    // Note: Terms are not bulk-updatable to preserve historical integrity.
    // Individual term dates can be updated via PATCH /academic-term/:id endpoint.

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
