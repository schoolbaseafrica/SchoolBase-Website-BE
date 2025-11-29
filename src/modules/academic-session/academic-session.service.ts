import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import * as sysMsg from '../../constants/system.messages';
import { TermName } from '../academic-term/entities/term.entity';
import { TermService } from '../academic-term/term.service';

import { CreateAcademicSessionDto } from './dto/create-academic-session.dto';
import { UpdateAcademicSessionDto } from './dto/update-academic-session.dto';
import { AcademicSession, SessionStatus } from './entities';
import { AcademicSessionModelAction } from './model-actions/academic-session-actions';
import {
  ICreateSessionResponse,
  IGetAllSessionsResponse,
  IGetSessionByIdResponse,
  IUpdateSessionResponse,
  IDeleteSessionResponse,
  IPaginationMeta,
} from './types';

export interface IListSessionsOptions {
  page?: number;
  limit?: number;
}

@Injectable()
export class AcademicSessionService {
  // TODO: Add logger functionality later
  // private readonly logger = new Logger(AcademicSessionService.name);

  constructor(
    private readonly sessionModelAction: AcademicSessionModelAction,
    private readonly dataSource: DataSource,
    private readonly termService: TermService,
  ) {}

  private validateSessionIsModifiable(session: AcademicSession): void {
    if (session.status === SessionStatus.ARCHIVED) {
      throw new ForbiddenException(sysMsg.ARCHIVED_SESSION_LOCKED);
    }
    // Active and Inactive sessions are modifiable for planning and management
  }

  /**
   * Normalizes a date to midnight (00:00:00) for date-only comparisons
   */
  private normalizeDateToMidnight(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  /**
   * Calculates session status based on current date vs session date range
   */
  private calculateSessionStatus(
    sessionStart: Date,
    sessionEnd: Date,
  ): SessionStatus {
    const today = this.normalizeDateToMidnight(new Date());
    const startDate = this.normalizeDateToMidnight(sessionStart);
    const endDate = this.normalizeDateToMidnight(sessionEnd);

    const isActive = today >= startDate && today <= endDate;
    const isFuture = today < startDate;

    return isActive
      ? SessionStatus.ACTIVE
      : isFuture
        ? SessionStatus.INACTIVE
        : SessionStatus.ARCHIVED;
  }

  /**
   * Updates session status based on current date.
   * Session is Active only if current date is within session date range.
   * This method is automatically called when fetching sessions.
   */
  async updateSessionStatus(sessionId: string): Promise<void> {
    const session = await this.sessionModelAction.get({
      identifierOptions: { id: sessionId },
    });

    if (!session) {
      return;
    }

    const correctStatus = this.calculateSessionStatus(
      session.startDate,
      session.endDate,
    );

    // Update only if status has changed
    if (session.status !== correctStatus) {
      await this.sessionModelAction.update({
        identifierOptions: { id: sessionId },
        updatePayload: { status: correctStatus },
        transactionOptions: { useTransaction: false },
      });
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

    // Validate session dates (compare date-only, ignoring time)
    const today = this.normalizeDateToMidnight(new Date());
    const startDateOnly = this.normalizeDateToMidnight(start);
    const endDateOnly = this.normalizeDateToMidnight(end);

    if (startDateOnly < today) {
      throw new BadRequestException(sysMsg.START_DATE_IN_PAST);
    }
    if (endDateOnly < today) {
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

    // Validate individual term dates
    const termNames = [TermName.FIRST, TermName.SECOND, TermName.THIRD];
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

    // Calculate initial session status based on dates
    const sessionStatus = this.calculateSessionStatus(start, end);

    // Use transaction to create session and terms together
    const newSession = await this.dataSource.transaction(async (manager) => {
      // Create the academic session with calculated status
      const session = manager.create(AcademicSession, {
        academicYear: academicYear,
        name: academicYear, // Set name same as academicYear for backward compatibility
        startDate: start,
        endDate: end,
        description: createSessionDto.description || null,
        status: sessionStatus,
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
      status_code: HttpStatus.CREATED,
      message: sysMsg.ACADEMIC_SESSION_CREATED,
      data: newSession,
    };
  }

  async findAll(
    options: IListSessionsOptions = {},
  ): Promise<IGetAllSessionsResponse> {
    const normalizedPage = Math.max(1, Math.floor(options.page ?? 1));
    const normalizedLimit = Math.max(1, Math.floor(options.limit ?? 20));

    // First, get all sessions to know which ones need term updates
    const initialFetch = await this.sessionModelAction.list({
      order: { startDate: 'ASC' },
      paginationPayload: {
        page: normalizedPage,
        limit: normalizedLimit,
      },
    });

    // Update session status and term statuses for each session
    for (const session of initialFetch.payload) {
      if (session.id) {
        await this.updateSessionStatus(session.id);
        await this.termService.findTermsBySessionId(session.id);
      }
    }

    // Fetch sessions again with updated term data
    const { payload, paginationMeta } = await this.sessionModelAction.list({
      order: { startDate: 'ASC' },
      paginationPayload: {
        page: normalizedPage,
        limit: normalizedLimit,
      },
    });

    const meta: IPaginationMeta = (paginationMeta as IPaginationMeta) ?? {
      total: 0,
      page: normalizedPage,
      limit: normalizedLimit,
      total_pages: 0,
      has_next: false,
      has_previous: false,
    };

    // Add status summary
    const statusSummary = {
      active: payload.filter((s) => s.status === SessionStatus.ACTIVE).length,
      inactive: payload.filter((s) => s.status === SessionStatus.INACTIVE)
        .length,
      archived: payload.filter((s) => s.status === SessionStatus.ARCHIVED)
        .length,
    };

    meta.summary = statusSummary;

    return {
      status_code: HttpStatus.OK,
      message: sysMsg.ACADEMIC_SESSION_LIST_SUCCESS,
      data: payload,
      meta,
    };
  }

  async findOne(id: string): Promise<IGetSessionByIdResponse> {
    // Check if session exists first
    const session = await this.sessionModelAction.get({
      identifierOptions: { id },
    });

    if (!session) {
      throw new NotFoundException(sysMsg.SESSION_NOT_FOUND);
    }

    // Update session status and term statuses, then refetch to get updated data
    await this.updateSessionStatus(id);
    await this.termService.findTermsBySessionId(id);

    const updatedSession = await this.sessionModelAction.get({
      identifierOptions: { id },
    });

    return {
      status_code: HttpStatus.OK,
      message: sysMsg.ACADEMIC_SESSION_RETRIEVED,
      data: updatedSession,
    };
  }

  async update(
    id: string,
    updateSessionDto: UpdateAcademicSessionDto,
  ): Promise<IUpdateSessionResponse> {
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

  async remove(id: string): Promise<IDeleteSessionResponse> {
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
