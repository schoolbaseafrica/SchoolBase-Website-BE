import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common'; // Added HttpStatus
import { Test, TestingModule } from '@nestjs/testing';

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
    };

    mockSessionModelAction =
      mockModelActionProvider as unknown as jest.Mocked<AcademicSessionModelAction>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademicSessionService,
        {
          provide: AcademicSessionModelAction,
          useValue: mockSessionModelAction,
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
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AcademicSessionService,
          {
            provide: AcademicSessionModelAction,
            useValue: {
              list: jest.fn(),
            },
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
});
