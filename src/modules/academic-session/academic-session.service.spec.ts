/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common'; // Added HttpStatus
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';

import * as sysMsg from '../../constants/system.messages';

import {
  AcademicSessionService,
  ICreateSessionResponse,
} from './academic-session.service';
import { CreateAcademicSessionDto } from './dto/create-academic-session.dto';
import {
  AcademicSession,
  SessionStatus,
} from './entities/academic-session.entity';
import { AcademicSessionModelAction } from './model-actions/academic-session-actions';

describe('AcademicSessionService', () => {
  let service: AcademicSessionService;
  let mockSessionModelAction: jest.Mocked<AcademicSessionModelAction>;

  beforeEach(async () => {
    // FIX: Use Partial<T> to define the required methods and the two-step assertion
    const mockModelActionProvider: Partial<AcademicSessionModelAction> = {
      get: jest.fn(),
      create: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
    };

    mockSessionModelAction =
      mockModelActionProvider as unknown as jest.Mocked<AcademicSessionModelAction>;

    // Mock DataSource - required by AcademicSessionService constructor
    const mockDataSource: Partial<DataSource> = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademicSessionService,
        {
          provide: AcademicSessionModelAction,
          useValue: mockSessionModelAction,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AcademicSessionService>(AcademicSessionService);
  });

  describe('create', () => {
    // Define a standard DTO and the corresponding full response object for reuse
    const createDto: CreateAcademicSessionDto = {
      name: '2024/2025',
      startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      endDate: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
    };

    const mockSession: AcademicSession = {
      id: '1',
      name: createDto.name,
      startDate: new Date(createDto.startDate),
      endDate: new Date(createDto.endDate),
      status: SessionStatus.INACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const expectedSuccessResponse: ICreateSessionResponse = {
      status_code: HttpStatus.OK, // Match service return
      message: sysMsg.ACADEMIC_SESSION_CREATED, // Match service return
      data: mockSession,
    };

    it('should create a new academic session successfully', async () => {
      mockSessionModelAction.get.mockResolvedValue(null);
      mockSessionModelAction.create.mockResolvedValue(mockSession);

      const result = await service.create(createDto);

      // ASSERTION CHANGE: Expect the full IcreateSessionResponse object
      expect(result).toEqual(expectedSuccessResponse);
      expect(mockSessionModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { name: createDto.name },
      });
      expect(mockSessionModelAction.create).toHaveBeenCalledWith({
        createPayload: {
          name: createDto.name,
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        },
        transactionOptions: { useTransaction: false },
      });
    });

    it('should throw ConflictException if session name already exists', async () => {
      // Cast needed to satisfy TS type check for existing record
      mockSessionModelAction.get.mockResolvedValue({} as AcademicSession);

      await expect(service.create(createDto)).rejects.toThrow(
        new ConflictException(sysMsg.DUPLICATE_SESSION_NAME),
      );
      expect(mockSessionModelAction.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if start date is in the past', async () => {
      const invalidDto: CreateAcademicSessionDto = {
        name: 'Past Start',
        startDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday (Invalid)
        endDate: new Date(Date.now() + 172800000).toISOString(),
      };

      mockSessionModelAction.get.mockResolvedValue(null);

      await expect(service.create(invalidDto)).rejects.toThrow(
        new BadRequestException(sysMsg.START_DATE_IN_PAST),
      );
    });

    it('should throw BadRequestException if end date is in the past', async () => {
      const invalidDto: CreateAcademicSessionDto = {
        name: 'Past End',
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday (Invalid)
      };

      mockSessionModelAction.get.mockResolvedValue(null);

      await expect(service.create(invalidDto)).rejects.toThrow(
        new BadRequestException(sysMsg.END_DATE_IN_PAST),
      );
    });

    it('should throw BadRequestException if end date is before or equal to start date', async () => {
      const startDate = new Date(Date.now() + 86400000);
      const invalidDto: CreateAcademicSessionDto = {
        name: 'Invalid Range',
        startDate: startDate.toISOString(),
        endDate: startDate.toISOString(), // Same as start date (Invalid)
      };

      mockSessionModelAction.get.mockResolvedValue(null);

      await expect(service.create(invalidDto)).rejects.toThrow(
        new BadRequestException(sysMsg.INVALID_DATE_RANGE),
      );
    });
  });

  // --- Placeholder Tests (Unchanged) ---
  describe('findAll', () => {
    const mockSessions: AcademicSession[] = [
      {
        id: '1',
        name: '2024/2025',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: SessionStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: '2025/2026',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        status: SessionStatus.INACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockPaginationMeta = {
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
    };

    it('should return paginated academic sessions with default pagination', async () => {
      mockSessionModelAction.list.mockResolvedValue({
        payload: mockSessions,
        paginationMeta: mockPaginationMeta,
      });

      const result = await service.findAll();

      expect(result).toEqual({
        status_code: HttpStatus.OK,
        message: sysMsg.ACADEMIC_SESSION_LIST_SUCCESS,
        data: mockSessions,
        meta: mockPaginationMeta,
      });
      expect(mockSessionModelAction.list).toHaveBeenCalledWith({
        order: { startDate: 'ASC' },
        paginationPayload: {
          page: 1,
          limit: 20,
        },
      });
    });

    it('should return paginated academic sessions with custom pagination', async () => {
      mockSessionModelAction.list.mockResolvedValue({
        payload: mockSessions.slice(0, 1),
        paginationMeta: { ...mockPaginationMeta, page: 2, limit: 1 },
      });

      const result = await service.findAll({ page: 2, limit: 1 });

      expect(result).toEqual({
        status_code: HttpStatus.OK,
        message: sysMsg.ACADEMIC_SESSION_LIST_SUCCESS,
        data: mockSessions.slice(0, 1),
        meta: { ...mockPaginationMeta, page: 2, limit: 1 },
      });
      expect(mockSessionModelAction.list).toHaveBeenCalledWith({
        order: { startDate: 'ASC' },
        paginationPayload: {
          page: 2,
          limit: 1,
        },
      });
    });

    it('should normalize invalid page and limit values', async () => {
      mockSessionModelAction.list.mockResolvedValue({
        payload: mockSessions,
        paginationMeta: mockPaginationMeta,
      });

      await service.findAll({ page: -1, limit: 0 });

      expect(mockSessionModelAction.list).toHaveBeenCalledWith({
        order: { startDate: 'ASC' },
        paginationPayload: {
          page: 1,
          limit: 1,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single academic session message', () => {
      const result = service.findOne(1);
      expect(result).toBe('This action returns a #1 academicSession');
    });
  });

  describe('update', () => {
    it('should return update message', () => {
      const result = service.update(1);
      expect(result).toBe('This action updates a #1 academicSession');
    });
  });

  describe('remove', () => {
    it('should return remove message', () => {
      const result = service.remove(1);
      expect(result).toBe('This action removes a #1 academicSession');
    });
  });

  describe('AcademicSessionService.activeSessions', () => {
    let service: AcademicSessionService;
    let modelAction: jest.Mocked<AcademicSessionModelAction>;

    const mockMeta = { total: 1 };

    const makeSession = (
      overrides: Partial<AcademicSession>,
    ): AcademicSession => {
      return {
        id: overrides.id ?? '1',
        name: overrides.name ?? '2024 Session',
        startDate: overrides.startDate ?? new Date('2024-01-01'),
        endDate: overrides.endDate ?? new Date('2024-12-31'),
        status: overrides.status ?? SessionStatus.ACTIVE,
        createdAt: overrides.createdAt ?? new Date(),
        updatedAt: overrides.updatedAt ?? new Date(),
      };
    };

    beforeEach(async () => {
      // Mock DataSource - required by AcademicSessionService constructor
      const mockDataSource: Partial<DataSource> = {
        transaction: jest.fn(),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AcademicSessionService,
          {
            provide: AcademicSessionModelAction,
            useValue: {
              list: jest.fn(),
            },
          },
          {
            provide: DataSource,
            useValue: mockDataSource,
          },
        ],
      }).compile();

      service = module.get(AcademicSessionService);
      modelAction = module.get(
        AcademicSessionModelAction,
      ) as jest.Mocked<AcademicSessionModelAction>;
    });

    test('returns null when no active sessions exist', async () => {
      modelAction.list.mockResolvedValue({
        payload: [],
        paginationMeta: mockMeta,
      });

      const result = await service.activeSessions();
      expect(result).toBeNull();
    });

    test('returns the single active session when exactly one exists', async () => {
      const session = makeSession({ id: '1' });

      modelAction.list.mockResolvedValue({
        payload: [session],
        paginationMeta: mockMeta,
      });

      const result = await service.activeSessions();
      expect(result).toEqual(session);
    });

    test('throws InternalServerErrorException when multiple active sessions exist', async () => {
      const s1 = makeSession({ id: '1' });
      const s2 = makeSession({ id: '2' });

      modelAction.list.mockResolvedValue({
        payload: [s1, s2],
        paginationMeta: mockMeta,
      });

      await expect(service.activeSessions()).rejects.toThrow(
        InternalServerErrorException,
      );

      await expect(service.activeSessions()).rejects.toThrow(
        sysMsg.MULTIPLE_ACTIVE_ACADEMIC_SESSION,
      );
    });
  });

  describe('AcademicSessionService - activeSessions', () => {
    let service: AcademicSessionService;
    let mockModelAction: jest.Mocked<AcademicSessionModelAction>;
    let mockDataSource: Partial<DataSource>;

    const makeSession = (
      overrides: Partial<AcademicSession> = {},
    ): AcademicSession => ({
      id: overrides.id ?? '1',
      name: overrides.name ?? '2024 Session',
      startDate: overrides.startDate ?? new Date('2024-01-01'),
      endDate: overrides.endDate ?? new Date('2024-12-31'),
      status: overrides.status ?? SessionStatus.ACTIVE,
      createdAt: overrides.createdAt ?? new Date(),
      updatedAt: overrides.updatedAt ?? new Date(),
    });

    beforeEach(async () => {
      const mockModelActionProvider: Partial<AcademicSessionModelAction> = {
        list: jest.fn(),
      };

      // Mock DataSource.transaction
      mockDataSource = {
        transaction: jest
          .fn()
          .mockImplementation(
            async <T>(
              callback: (manager: EntityManager) => Promise<T>,
            ): Promise<T> => {
              const mockManager = {
                update: jest.fn(),
                findOne: jest.fn(),
              } as unknown as EntityManager;
              return callback(mockManager);
            },
          ),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AcademicSessionService,
          {
            provide: AcademicSessionModelAction,
            useValue: mockModelActionProvider,
          },
          { provide: DataSource, useValue: mockDataSource },
        ],
      }).compile();

      service = module.get(AcademicSessionService);
      mockModelAction = module.get(
        AcademicSessionModelAction,
      ) as jest.Mocked<AcademicSessionModelAction>;
    });

    it('returns null when no active sessions exist', async () => {
      mockModelAction.list.mockResolvedValue({
        payload: [],
        paginationMeta: { total: 0 },
      });
      const result = await service.activeSessions();
      expect(result).toBeNull();
      expect(mockModelAction.list).toHaveBeenCalledWith({
        filterRecordOptions: { status: SessionStatus.ACTIVE },
      });
    });

    it('returns the single active session when exactly one exists', async () => {
      const session = makeSession({ id: '1' });
      mockModelAction.list.mockResolvedValue({
        payload: [session],
        paginationMeta: { total: 1 },
      });
      const result = await service.activeSessions();
      expect(result).toEqual(session);
    });

    it('throws InternalServerErrorException when multiple active sessions exist', async () => {
      const s1 = makeSession({ id: '1' });
      const s2 = makeSession({ id: '2' });
      mockModelAction.list.mockResolvedValue({
        payload: [s1, s2],
        paginationMeta: { total: 2 },
      });

      await expect(service.activeSessions()).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.activeSessions()).rejects.toThrow(
        sysMsg.MULTIPLE_ACTIVE_ACADEMIC_SESSION,
      );
    });
  });
  describe('AcademicSessionService - activateSession', () => {
    let service: AcademicSessionService;
    let mockSessionModelAction: jest.Mocked<AcademicSessionModelAction>;
    let mockDataSource: Partial<DataSource>;

    const sessionId = '1';
    const mockSession: AcademicSession = {
      id: sessionId,
      name: '2024/2025',
      startDate: new Date(),
      endDate: new Date(),
      status: SessionStatus.INACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(async () => {
      // FIX: Add all required methods including update
      mockSessionModelAction = {
        get: jest.fn(),
        update: jest.fn(), // <-- This was missing!
      } as unknown as jest.Mocked<AcademicSessionModelAction>;

      mockDataSource = {
        transaction: jest
          .fn()
          .mockImplementation(
            async (callback: (manager: EntityManager) => unknown) => {
              const mockManager: Partial<EntityManager> = {
                update: jest.fn().mockResolvedValue({ affected: 1 }),
              };
              return callback(mockManager as EntityManager);
            },
          ),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AcademicSessionService,
          {
            provide: AcademicSessionModelAction,
            useValue: mockSessionModelAction,
          },
          { provide: DataSource, useValue: mockDataSource },
        ],
      }).compile();

      service = module.get<AcademicSessionService>(AcademicSessionService);
    });

    it('should activate a session successfully', async () => {
      // Setup mocks
      mockSessionModelAction.get
        .mockResolvedValueOnce(mockSession) // First call before transaction
        .mockResolvedValueOnce({
          ...mockSession,
          status: SessionStatus.ACTIVE,
        }); // Second call within transaction to get updated session

      // Mock update to return the update result
      mockSessionModelAction.update
        .mockResolvedValueOnce({ affected: 1 } as any)
        .mockResolvedValueOnce({ affected: 1 } as any);

      const result = await service.activateSession(sessionId);

      // Assertions
      expect(result).toEqual({
        status_code: HttpStatus.OK,
        message: sysMsg.ACADEMY_SESSION_ACTIVATED,
        data: { ...mockSession, status: SessionStatus.ACTIVE },
      });

      // Verify mockSessionModelAction.get was called to check if session exists
      expect(mockSessionModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: sessionId },
      });

      // Verify first update deactivated all sessions
      expect(mockSessionModelAction.update).toHaveBeenNthCalledWith(1, {
        updatePayload: { status: SessionStatus.INACTIVE },
        identifierOptions: {},
        transactionOptions: {
          useTransaction: true,
          transaction: expect.any(Object),
        },
      });

      // Verify second update activated the target session
      expect(mockSessionModelAction.update).toHaveBeenNthCalledWith(2, {
        identifierOptions: { id: sessionId },
        updatePayload: { status: SessionStatus.ACTIVE },
        transactionOptions: {
          useTransaction: true,
          transaction: expect.any(Object),
        },
      });
    });

    it('should throw BadRequestException if session not found', async () => {
      mockSessionModelAction.get.mockResolvedValue(null);

      await expect(service.activateSession(sessionId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.activateSession(sessionId)).rejects.toThrow(
        sysMsg.SESSION_NOT_FOUND,
      );
    });

    it('should throw BadRequestException if update fails to activate session', async () => {
      mockSessionModelAction.get.mockResolvedValue(mockSession);
      mockSessionModelAction.update
        .mockResolvedValueOnce({ affected: 1 } as any) // First update succeeds
        .mockResolvedValueOnce(null); // Second update returns null (failure)

      await expect(service.activateSession(sessionId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.activateSession(sessionId)).rejects.toThrow(
        `Failed to activate session ${sessionId}. Session may have been deleted.`,
      );
    });

    it('should throw error if transaction fails', async () => {
      mockSessionModelAction.get.mockResolvedValue(mockSession);
      (mockDataSource.transaction as jest.Mock).mockRejectedValueOnce(
        new Error('DB error'),
      );

      await expect(service.activateSession(sessionId)).rejects.toThrow(
        'DB error',
      );
    });
  });
});
