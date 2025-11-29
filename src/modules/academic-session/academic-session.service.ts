import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
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
    if (session.status === SessionStatus.ARCHIVED) {
      throw new ForbiddenException(sysMsg.ARCHIVED_SESSION_LOCKED);
    }
  }

  async create(
    createSessionDto: CreateAcademicSessionDto,
  ): Promise<ICreateSessionResponse> {
    // Auto-assign term names based on array order: [0]=First, [1]=Second, [2]=Third
    const {
      first_term: firstTerm,
      second_term: secondTerm,
      third_term: thirdTerm,
    } = createSessionDto.terms;

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

    // Generate academic year from start and end year
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    const academicYear = `${startYear}/${endYear}`;

    const existingSession = await this.sessionModelAction.get({
      identifierOptions: { academicYear: academicYear },
    });

    if (existingSession) {
      throw new ConflictException(
        `Academic session ${academicYear} already exists.`,
      );
    }

    // Check if there's an ongoing (active) session that hasn't ended
    const activeSessions = await this.sessionModelAction.list({
      filterRecordOptions: { status: SessionStatus.ACTIVE },
    });

    const currentDate = new Date();
    for (const activeSession of activeSessions.payload) {
      // If the active session's end date is in the future, it's still ongoing
      if (new Date(activeSession.endDate) > currentDate) {
        throw new ConflictException(sysMsg.ONGOING_SESSION_EXISTS);
      }
    }

    // Validate individual term dates
    const termNames = ['First term', 'Second term', 'Third term'];
    const termDtos = [firstTerm, secondTerm, thirdTerm];

    termDtos.forEach((termDto, i) => {
      const termStart = new Date(termDto.startDate);
      const termEnd = new Date(termDto.endDate);

      if (termEnd <= termStart) {
        throw new BadRequestException(
          `${termNames[i]} ${sysMsg.TERM_INVALID_DATE_RANGE}`,
        );
      }
    });

    // Validate sequential term dates
    const firstTermEnd = new Date(firstTerm.endDate);
    const secondTermStart = new Date(secondTerm.startDate);
    const secondTermEnd = new Date(secondTerm.endDate);
    const thirdTermStart = new Date(thirdTerm.startDate);

    if (secondTermStart <= firstTermEnd) {
      throw new BadRequestException(
        `${termNames[1]} ${sysMsg.TERM_SEQUENTIAL_INVALID}`,
      );
    }

    if (thirdTermStart <= secondTermEnd) {
      throw new BadRequestException(
        `${termNames[2]} ${sysMsg.TERM_SEQUENTIAL_INVALID}`,
      );
    }

    // Use transaction to create session and terms together
    const newSession = await this.dataSource.transaction(async (manager) => {
      // Get all currently active sessions to archive their terms
      const activeSessions = await this.sessionModelAction.list({
        filterRecordOptions: { status: SessionStatus.ACTIVE },
      });

      // Archive all currently active sessions and their terms (previous session becomes read-only)
      for (const activeSession of activeSessions.payload) {
        // Archive the terms of the active session
        await this.termService.archiveTermsBySessionId(
          activeSession.id,
          manager,
        );
      }

      // Archive the session itself
      await this.sessionModelAction.update({
        updatePayload: { status: SessionStatus.ARCHIVED },
        identifierOptions: { status: SessionStatus.ACTIVE },
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });

      // Create the academic session as ACTIVE (current session)
      const session = manager.create(AcademicSession, {
        academicYear: academicYear,
        name: academicYear, // Set name same as academicYear for backward compatibility
        startDate: start,
        endDate: end,
        description: createSessionDto.description || null,
        status: SessionStatus.ACTIVE,
      });

      const savedSession = await manager.save(AcademicSession, session);

      // Create associated terms using TermService
      await this.termService.createTermsForSession(
        savedSession.id,
        [firstTerm, secondTerm, thirdTerm],
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

  async findOne(id: string) {
    const session = await this.sessionModelAction.get({
      identifierOptions: { id },
    });

    if (!session) {
      throw new NotFoundException(sysMsg.SESSION_NOT_FOUND);
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
      throw new NotFoundException(sysMsg.SESSION_NOT_FOUND);
    }

    // LOCK CHECK: Prevent modification of archived sessions
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
      throw new NotFoundException(sysMsg.SESSION_NOT_FOUND);
    }

    // LOCK CHECK: Prevent deletion of active sessions (must be archived first)
    if (session.status === SessionStatus.ACTIVE) {
      throw new ForbiddenException(sysMsg.ACTIVE_SESSION_NO_DELETE);
    }

    // Soft delete the archived session (sets deletedAt timestamp)
    await this.sessionModelAction.delete({
      identifierOptions: { id },
      transactionOptions: { useTransaction: false },
    });

    // Retrieve the soft-deleted session to return in response
    const sessionRepository = this.dataSource.getRepository(AcademicSession);
    const deletedSession = await sessionRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    return {
      status_code: HttpStatus.OK,
      message: sysMsg.ACADEMIC_SESSION_DELETED,
      data: deletedSession,
    };
  }
}
