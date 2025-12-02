import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource, EntityManager } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../constants/system.messages';
import { CreateTermDto } from '../academic-term/dto/create-term.dto';
import { TermService } from '../academic-term/term.service';

import { AcademicSessionService } from './academic-session.service';
import { CreateAcademicSessionDto } from './dto';
import { AcademicSession, SessionStatus } from './entities';
import { AcademicSessionModelAction } from './model-actions/academic-session-actions';

describe('AcademicSessionService', () => {
  let service: AcademicSessionService;
  let sessionModelAction: jest.Mocked<AcademicSessionModelAction>;
  let termService: jest.Mocked<TermService>;
  let mockLogger: jest.Mocked<Logger>;

  const mockCreate = jest.fn();
  const mockSave = jest.fn();
  const mockFindOne = jest.fn();
  const mockGetRepository = jest.fn();

  const mockEntityManager = {
    create: mockCreate,
    save: mockSave,
    findOne: mockFindOne,
  } as unknown as EntityManager;

  const mockSessionModelAction = {
    get: jest.fn(),
    create: jest.fn(),
    list: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockTermService = {
    createTermsForSession: jest.fn(),
    archiveTermsBySessionId: jest.fn(),
    findTermsBySessionId: jest.fn(),
  };

  beforeEach(async () => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(),
      child: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<Logger>;

    const mockDataSource = {
      transaction: jest.fn((callback) => callback(mockEntityManager)),
      getRepository: mockGetRepository,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademicSessionService,
        {
          provide: AcademicSessionModelAction,
          useValue: mockSessionModelAction,
        },
        {
          provide: TermService,
          useValue: mockTermService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<AcademicSessionService>(AcademicSessionService);
    sessionModelAction = module.get(AcademicSessionModelAction);
    termService = module.get(TermService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const yearAfter = new Date(futureDate);
    yearAfter.setFullYear(yearAfter.getFullYear() + 1);

    const validTerms = [
      {
        startDate: `${futureDate.getFullYear()}-09-01`,
        endDate: `${futureDate.getFullYear()}-12-15`,
      },
      {
        startDate: `${futureDate.getFullYear() + 1}-01-06`,
        endDate: `${futureDate.getFullYear() + 1}-03-28`,
      },
      {
        startDate: `${futureDate.getFullYear() + 1}-04-14`,
        endDate: `${futureDate.getFullYear() + 1}-07-20`,
      },
    ] as [CreateTermDto, CreateTermDto, CreateTermDto];

    const createDto: CreateAcademicSessionDto = {
      description: 'Test Academic Session',
      terms: {
        first_term: validTerms[0],
        second_term: validTerms[1],
        third_term: validTerms[2],
      },
    };
    const mockSession: AcademicSession = {
      id: 'session-id',
      academicYear: `${futureDate.getFullYear()}/${futureDate.getFullYear() + 1}`,
      name: `${futureDate.getFullYear()}/${futureDate.getFullYear() + 1}`,
      startDate: new Date(`${futureDate.getFullYear()}-09-01`),
      endDate: new Date(`${futureDate.getFullYear() + 1}-07-20`),
      description: 'Test Academic Session',
      status: SessionStatus.INACTIVE, // Future session, not yet active
      terms: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a new academic session successfully', async () => {
      sessionModelAction.get.mockResolvedValue(null);
      sessionModelAction.list.mockResolvedValue({
        payload: [],
        paginationMeta: null,
      });
      mockCreate.mockReturnValue(mockSession);
      mockSave.mockResolvedValue(mockSession);
      mockFindOne.mockResolvedValue(mockSession);
      termService.createTermsForSession.mockResolvedValue([]);

      const result = await service.create(createDto);

      expect(result).toEqual({
        status_code: HttpStatus.CREATED,
        message: sysMsg.ACADEMIC_SESSION_CREATED,
        data: mockSession,
      });
      expect(sessionModelAction.get).toHaveBeenCalledWith({
        identifierOptions: {
          academicYear: `${futureDate.getFullYear()}/${futureDate.getFullYear() + 1}`,
        },
      });
      expect(termService.createTermsForSession).toHaveBeenCalled();
    });

    it('should throw ConflictException if session already exists', async () => {
      sessionModelAction.get.mockResolvedValue(mockSession);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        `Academic session ${futureDate.getFullYear()}/${futureDate.getFullYear() + 1} already exists.`,
      );
    });

    it('should throw BadRequestException if start date is in the past', async () => {
      const pastDto: CreateAcademicSessionDto = {
        description: 'Past session',
        terms: {
          first_term: { startDate: '2020-01-01', endDate: '2020-12-31' },
          second_term: { startDate: '2021-01-01', endDate: '2021-12-31' },
          third_term: { startDate: '2022-01-01', endDate: '2022-12-31' },
        },
      };
      sessionModelAction.get.mockResolvedValue(null);

      await expect(service.create(pastDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(pastDto)).rejects.toThrow(
        sysMsg.START_DATE_IN_PAST,
      );
    });

    it('should throw BadRequestException for invalid term date ranges', async () => {
      const nextYear = futureDate.getFullYear() + 2;
      const invalidDto: CreateAcademicSessionDto = {
        description: 'Invalid session',
        terms: {
          first_term: { startDate: `${nextYear}-12-01`, endDate: `${nextYear}-11-01` },
          second_term: { startDate: `${nextYear + 1}-01-01`, endDate: `${nextYear + 1}-12-31` },
          third_term: { startDate: `${nextYear + 2}-01-01`, endDate: `${nextYear + 2}-12-31` },
        },
      };

      sessionModelAction.get.mockResolvedValue(null);
      sessionModelAction.list.mockResolvedValue({
        payload: [],
        paginationMeta: null,
      });

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(invalidDto)).rejects.toThrow(
        sysMsg.TERM_INVALID_DATE_RANGE,
      );
    });

    it('should throw BadRequestException if terms are not sequential', async () => {
      const nextYear = futureDate.getFullYear() + 2;
      const nonSequentialDto: CreateAcademicSessionDto = {
        description: 'Non-sequential terms',
        terms: {
          first_term: {
            startDate: `${nextYear}-01-01`,
            endDate: `${nextYear}-03-31`,
          },
          second_term: {
            startDate: `${nextYear}-03-30`,
            endDate: `${nextYear}-06-30`,
          },
          third_term: {
            startDate: `${nextYear}-07-01`,
            endDate: `${nextYear}-12-31`,
          },
        },
      };

      sessionModelAction.get.mockResolvedValue(null);
      sessionModelAction.list.mockResolvedValue({
        payload: [],
        paginationMeta: null,
      });

      await expect(service.create(nonSequentialDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(nonSequentialDto)).rejects.toThrow(
        sysMsg.TERM_SEQUENTIAL_INVALID,
      );
    });
  });

  describe('findAll', () => {
    it('should return all sessions with pagination', async () => {
      const mockSessions: AcademicSession[] = [
        {
          id: '1',
          academicYear: '2024/2025',
          name: '2024/2025',
          startDate: new Date('2024-09-01'),
          endDate: new Date('2025-07-20'),
          description: 'Session 1',
          status: SessionStatus.ACTIVE,
          terms: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      sessionModelAction.list.mockResolvedValue({
        payload: mockSessions,
        paginationMeta: { page: 1, limit: 20, total: 1 },
      });

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.status_code).toBe(HttpStatus.OK);
      expect(result.message).toBe(sysMsg.ACADEMIC_SESSION_LIST_SUCCESS);
      expect(result.data).toEqual(mockSessions);
      expect(result.meta).toBeDefined();
      expect(result.meta.summary).toBeDefined();
      expect(result.meta.summary).toEqual({
        active: 1,
        inactive: 0,
        archived: 0,
      });
    });

    it('should use default pagination values', async () => {
      sessionModelAction.list.mockResolvedValue({
        payload: [],
        paginationMeta: { page: 1, limit: 20, total: 0 },
      });

      await service.findAll({});

      expect(sessionModelAction.list).toHaveBeenCalledWith({
        order: { startDate: 'ASC' },
        paginationPayload: {
          page: 1,
          limit: 20,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a session by id', async () => {
      const mockSession: AcademicSession = {
        id: 'session-id',
        academicYear: '2024/2025',
        name: '2024/2025',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-07-20'),
        description: 'Test Session',
        status: SessionStatus.ACTIVE,
        terms: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      sessionModelAction.get.mockResolvedValue(mockSession);

      const result = await service.findOne('session-id');

      expect(result.status_code).toBe(HttpStatus.OK);
      expect(result.message).toBe(sysMsg.ACADEMIC_SESSION_RETRIEVED);
      expect(result.data).toEqual(mockSession);
    });

    it('should throw BadRequestException if session not found', async () => {
      sessionModelAction.get.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        sysMsg.SESSION_NOT_FOUND,
      );
    });
  });

  describe('update', () => {
    const mockSession: AcademicSession = {
      id: 'session-id',
      academicYear: '2024/2025',
      name: '2024/2025',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-07-20'),
      description: 'Test Session',
      status: SessionStatus.ACTIVE,
      terms: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update session description', async () => {
      const updateDto = { description: 'Updated description' };
      const updatedSession = {
        ...mockSession,
        description: updateDto.description,
      };

      sessionModelAction.get
        .mockResolvedValueOnce(mockSession)
        .mockResolvedValueOnce(updatedSession);
      sessionModelAction.update.mockResolvedValue(updatedSession);

      const result = await service.update('session-id', updateDto);

      expect(result.status_code).toBe(HttpStatus.OK);
      expect(result.message).toBe(sysMsg.ACADEMIC_SESSION_UPDATED);
      expect(sessionModelAction.update).toHaveBeenCalledWith({
        identifierOptions: { id: 'session-id' },
        updatePayload: { description: updateDto.description },
        transactionOptions: { useTransaction: false },
      });
    });

    it('should throw BadRequestException if session not found', async () => {
      sessionModelAction.get.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { description: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if session is archived', async () => {
      const archivedSession = {
        ...mockSession,
        status: SessionStatus.ARCHIVED,
      };

      sessionModelAction.get.mockResolvedValue(archivedSession);

      await expect(
        service.update('session-id', { description: 'Test' }),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.update('session-id', { description: 'Test' }),
      ).rejects.toThrow(sysMsg.ARCHIVED_SESSION_LOCKED);
    });
  });

  describe('remove', () => {
    const mockSession: AcademicSession = {
      id: 'session-id',
      academicYear: '2024/2025',
      name: '2024/2025',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-07-20'),
      description: 'Test Session',
      status: SessionStatus.ACTIVE,
      terms: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should throw ForbiddenException when trying to delete active session', async () => {
      sessionModelAction.get.mockResolvedValue(mockSession);

      await expect(service.remove('session-id')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.remove('session-id')).rejects.toThrow(
        sysMsg.ACTIVE_SESSION_NO_DELETE,
      );
    });

    it('should throw BadRequestException if session not found', async () => {
      sessionModelAction.get.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should soft delete an archived session', async () => {
      const archivedSession = {
        ...mockSession,
        status: SessionStatus.ARCHIVED,
      };

      const deletedSession = {
        ...archivedSession,
        deletedAt: new Date(),
      };

      sessionModelAction.get.mockResolvedValue(archivedSession);
      sessionModelAction.delete.mockResolvedValue(undefined);

      const mockRepository = {
        findOne: jest.fn().mockResolvedValue(deletedSession),
      };
      mockGetRepository.mockReturnValue(mockRepository);

      const result = await service.remove('session-id');

      expect(result.status_code).toBe(HttpStatus.OK);
      expect(result.message).toBe(sysMsg.ACADEMIC_SESSION_DELETED);
      expect(result.data).toEqual(deletedSession);
      expect(sessionModelAction.delete).toHaveBeenCalledWith({
        identifierOptions: { id: 'session-id' },
        transactionOptions: { useTransaction: false },
      });
    });
  });

  describe('activeSessions', () => {
    it('should return active session', async () => {
      const mockActiveSession: AcademicSession = {
        id: 'session-123',
        name: '2023/2024',
        startDate: new Date('2023-09-01'),
        endDate: new Date('2024-08-31'),
        status: SessionStatus.ACTIVE,
      } as AcademicSession;

      sessionModelAction.list.mockResolvedValue({
        payload: [mockActiveSession],
        paginationMeta: { page: 1, limit: 20, total: 1 },
      });

      const result = await service.activeSessions();

      expect(result.status_code).toBe(HttpStatus.OK);
      expect(result.message).toBe(sysMsg.ACTIVE_ACADEMIC_SESSION_SUCCESS);
      expect(result.data).toEqual(mockActiveSession);
      expect(sessionModelAction.list).toHaveBeenCalledWith({
        filterRecordOptions: { status: SessionStatus.ACTIVE },
      });
    });

    it('should throw NotFoundException when no active session exists', async () => {
      sessionModelAction.list.mockResolvedValue({
        payload: [],
        paginationMeta: { page: 1, limit: 20, total: 0 },
      });

      await expect(service.activeSessions()).rejects.toThrow(NotFoundException);
      await expect(service.activeSessions()).rejects.toThrow(
        sysMsg.NO_ACTIVE_SESSION,
      );

      expect(sessionModelAction.list).toHaveBeenCalledWith({
        filterRecordOptions: { status: SessionStatus.ACTIVE },
      });
    });
  });
});
