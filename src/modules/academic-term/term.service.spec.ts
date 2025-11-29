import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';

import * as sysMsg from '../../constants/system.messages';
import { AcademicSessionModelAction } from '../academic-session/model-actions/academic-session-actions';

import { CreateTermDto } from './dto/create-term.dto';
import { UpdateTermDto } from './dto/update-term.dto';
import { Term, TermName, TermStatus } from './entities/term.entity';
import { TermModelAction } from './model-actions';
import { TermService } from './term.service';

describe('TermService', () => {
  let service: TermService;
  let termModelAction: jest.Mocked<TermModelAction>;

  const mockEntityManager = {} as EntityManager;

  beforeEach(async () => {
    const mockTermModelAction = {
      create: jest.fn(),
      get: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockSessionModelAction = {
      update: jest.fn(),
      get: jest.fn(),
      list: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TermService,
        {
          provide: TermModelAction,
          useValue: mockTermModelAction,
        },
        {
          provide: AcademicSessionModelAction,
          useValue: mockSessionModelAction,
        },
      ],
    }).compile();

    service = module.get<TermService>(TermService);
    termModelAction = module.get(TermModelAction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTermsForSession', () => {
    const sessionId = 'session-123';
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const termDtos: CreateTermDto[] = [
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
    ];

    const mockTerms: Term[] = [
      {
        id: 'term-1',
        sessionId,
        name: TermName.FIRST,
        startDate: new Date(termDtos[0].startDate),
        endDate: new Date(termDtos[0].endDate),
        status: TermStatus.ACTIVE,
        isCurrent: false,
        academicSession: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'term-2',
        sessionId,
        name: TermName.SECOND,
        startDate: new Date(termDtos[1].startDate),
        endDate: new Date(termDtos[1].endDate),
        status: TermStatus.ACTIVE,
        isCurrent: false,
        academicSession: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'term-3',
        sessionId,
        name: TermName.THIRD,
        startDate: new Date(termDtos[2].startDate),
        endDate: new Date(termDtos[2].endDate),
        status: TermStatus.ACTIVE,
        isCurrent: false,
        academicSession: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should create three terms with correct names in order', async () => {
      termModelAction.create
        .mockResolvedValueOnce(mockTerms[0])
        .mockResolvedValueOnce(mockTerms[1])
        .mockResolvedValueOnce(mockTerms[2]);

      const result = await service.createTermsForSession(sessionId, termDtos);

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe(TermName.FIRST);
      expect(result[1].name).toBe(TermName.SECOND);
      expect(result[2].name).toBe(TermName.THIRD);
      expect(termModelAction.create).toHaveBeenCalledTimes(3);
    });

    it('should create terms with ACTIVE status', async () => {
      termModelAction.create
        .mockResolvedValueOnce(mockTerms[0])
        .mockResolvedValueOnce(mockTerms[1])
        .mockResolvedValueOnce(mockTerms[2]);

      const result = await service.createTermsForSession(sessionId, termDtos);

      expect(result[0].status).toBe(TermStatus.ACTIVE);
      expect(result[1].status).toBe(TermStatus.ACTIVE);
      expect(result[2].status).toBe(TermStatus.ACTIVE);
    });

    it('should create terms with isCurrent set to false', async () => {
      termModelAction.create
        .mockResolvedValueOnce(mockTerms[0])
        .mockResolvedValueOnce(mockTerms[1])
        .mockResolvedValueOnce(mockTerms[2]);

      const result = await service.createTermsForSession(sessionId, termDtos);

      expect(result[0].isCurrent).toBe(false);
      expect(result[1].isCurrent).toBe(false);
      expect(result[2].isCurrent).toBe(false);
    });

    it('should pass EntityManager to create when provided', async () => {
      termModelAction.create
        .mockResolvedValueOnce(mockTerms[0])
        .mockResolvedValueOnce(mockTerms[1])
        .mockResolvedValueOnce(mockTerms[2]);

      await service.createTermsForSession(
        sessionId,
        termDtos,
        mockEntityManager,
      );

      expect(termModelAction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionOptions: {
            useTransaction: true,
            transaction: mockEntityManager,
          },
        }),
      );
    });

    it('should work without EntityManager', async () => {
      termModelAction.create
        .mockResolvedValueOnce(mockTerms[0])
        .mockResolvedValueOnce(mockTerms[1])
        .mockResolvedValueOnce(mockTerms[2]);

      await service.createTermsForSession(sessionId, termDtos);

      expect(termModelAction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionOptions: {
            useTransaction: false,
            transaction: undefined,
          },
        }),
      );
    });
  });

  describe('findTermsBySessionId', () => {
    const sessionId = 'session-123';
    const mockTerms: Term[] = [
      {
        id: 'term-1',
        sessionId,
        name: TermName.FIRST,
        startDate: new Date('2025-09-01'),
        endDate: new Date('2025-12-15'),
        status: TermStatus.ACTIVE,
        isCurrent: false,
        academicSession: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return all terms for a session ordered by startDate', async () => {
      termModelAction.list.mockResolvedValue({
        payload: mockTerms,
        paginationMeta: null,
      });

      const result = await service.findTermsBySessionId(sessionId);

      expect(result).toEqual(mockTerms);
      expect(termModelAction.list).toHaveBeenCalledWith({
        filterRecordOptions: { sessionId },
        order: { startDate: 'ASC' },
      });
    });

    it('should return empty array when no terms found', async () => {
      termModelAction.list.mockResolvedValue({
        payload: [],
        paginationMeta: null,
      });

      const result = await service.findTermsBySessionId(sessionId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    const mockTerm: Term = {
      id: 'term-1',
      sessionId: 'session-123',
      name: TermName.FIRST,
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-12-15'),
      status: TermStatus.ACTIVE,
      isCurrent: false,
      academicSession: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return a term by id', async () => {
      termModelAction.get.mockResolvedValue(mockTerm);
      termModelAction.list.mockResolvedValue({
        payload: [mockTerm],
        paginationMeta: null,
      });

      const result = await service.findOne('term-1');

      expect(result).toEqual(mockTerm);
      expect(termModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: 'term-1' },
      });
    });

    it('should throw NotFoundException when term not found', async () => {
      termModelAction.get.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        sysMsg.TERM_NOT_FOUND,
      );
    });
  });

  describe('updateTerm', () => {
    const mockTerm: Term = {
      id: 'term-1',
      sessionId: 'session-123',
      name: TermName.FIRST,
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-12-15'),
      status: TermStatus.ACTIVE,
      isCurrent: false,
      academicSession: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update term dates successfully', async () => {
      const updateDto: UpdateTermDto = {
        startDate: '2025-09-05',
        endDate: '2025-12-20',
      };

      const updatedTerm = {
        ...mockTerm,
        startDate: new Date(updateDto.startDate),
        endDate: new Date(updateDto.endDate),
      };

      termModelAction.get
        .mockResolvedValueOnce(mockTerm)
        .mockResolvedValueOnce(updatedTerm);
      termModelAction.update.mockResolvedValue(updatedTerm);
      termModelAction.list.mockResolvedValue({
        payload: [updatedTerm],
        paginationMeta: null,
      });

      const result = await service.updateTerm('term-1', updateDto);

      expect(result).toEqual(updatedTerm);
      expect(termModelAction.update).toHaveBeenCalledWith({
        identifierOptions: { id: 'term-1' },
        updatePayload: {
          startDate: new Date(updateDto.startDate),
          endDate: new Date(updateDto.endDate),
        },
        transactionOptions: {
          useTransaction: false,
        },
      });
    });

    it('should throw NotFoundException when term not found', async () => {
      termModelAction.get.mockResolvedValue(null);

      await expect(
        service.updateTerm('non-existent-id', { startDate: '2025-09-01' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when updating past (archived) term', async () => {
      // Create a term that ended in the past
      const pastTerm = {
        ...mockTerm,
        startDate: new Date('2024-09-01'),
        endDate: new Date('2024-12-15'), // Past date
        status: TermStatus.INACTIVE,
      };
      termModelAction.get.mockResolvedValue(pastTerm);

      await expect(
        service.updateTerm('term-1', { startDate: '2024-09-05' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateTerm('term-1', { startDate: '2024-09-05' }),
      ).rejects.toThrow(sysMsg.ARCHIVED_TERM_LOCKED);
    });

    it('should throw BadRequestException when endDate is before startDate', async () => {
      const updateDto: UpdateTermDto = {
        startDate: '2025-12-01',
        endDate: '2025-11-01',
      };

      termModelAction.get.mockResolvedValue(mockTerm);

      await expect(service.updateTerm('term-1', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateTerm('term-1', updateDto)).rejects.toThrow(
        sysMsg.TERM_INVALID_DATE_RANGE,
      );
    });

    it('should throw BadRequestException when new startDate is after existing endDate', async () => {
      const updateDto: UpdateTermDto = {
        startDate: '2025-12-20',
      };

      termModelAction.get.mockResolvedValue(mockTerm);

      await expect(service.updateTerm('term-1', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateTerm('term-1', updateDto)).rejects.toThrow(
        sysMsg.TERM_INVALID_DATE_RANGE,
      );
    });

    it('should throw BadRequestException when new endDate is before existing startDate', async () => {
      const updateDto: UpdateTermDto = {
        endDate: '2025-08-01',
      };

      termModelAction.get.mockResolvedValue(mockTerm);

      await expect(service.updateTerm('term-1', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateTerm('term-1', updateDto)).rejects.toThrow(
        sysMsg.TERM_INVALID_DATE_RANGE,
      );
    });

    it('should throw BadRequestException when update fails', async () => {
      const updateDto: UpdateTermDto = {
        startDate: '2025-09-05',
      };

      termModelAction.get.mockResolvedValue(mockTerm);
      termModelAction.list.mockResolvedValue({
        payload: [mockTerm],
        paginationMeta: {},
      });
      termModelAction.update.mockResolvedValue(null);

      await expect(service.updateTerm('term-1', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateTerm('term-1', updateDto)).rejects.toThrow(
        sysMsg.TERM_UPDATE_FAILED,
      );
    });

    it('should update only startDate when endDate is not provided', async () => {
      const updateDto: UpdateTermDto = {
        startDate: '2025-09-05',
      };

      const updatedTerm = {
        ...mockTerm,
        startDate: new Date(updateDto.startDate),
      };

      termModelAction.get.mockResolvedValue(mockTerm);
      termModelAction.update.mockResolvedValue(updatedTerm);
      termModelAction.list.mockResolvedValue({
        payload: [updatedTerm],
        paginationMeta: null,
      });

      await service.updateTerm('term-1', updateDto);

      expect(termModelAction.update).toHaveBeenCalledWith({
        identifierOptions: { id: 'term-1' },
        updatePayload: {
          startDate: new Date(updateDto.startDate),
        },
        transactionOptions: {
          useTransaction: false,
        },
      });
    });

    it('should update only endDate when startDate is not provided', async () => {
      const updateDto: UpdateTermDto = {
        endDate: '2025-12-20',
      };

      const updatedTerm = {
        ...mockTerm,
        endDate: new Date(updateDto.endDate),
      };

      termModelAction.get.mockResolvedValue(mockTerm);
      termModelAction.update.mockResolvedValue(updatedTerm);
      termModelAction.list.mockResolvedValue({
        payload: [updatedTerm],
        paginationMeta: null,
      });

      await service.updateTerm('term-1', updateDto);

      expect(termModelAction.update).toHaveBeenCalledWith({
        identifierOptions: { id: 'term-1' },
        updatePayload: {
          endDate: new Date(updateDto.endDate),
        },
        transactionOptions: {
          useTransaction: false,
        },
      });
    });
  });

  describe('archiveTermsBySessionId', () => {
    const sessionId = 'session-123';

    it('should archive all terms for a session', async () => {
      termModelAction.update.mockResolvedValue(null);

      await service.archiveTermsBySessionId(sessionId);

      expect(termModelAction.update).toHaveBeenCalledWith({
        identifierOptions: { sessionId },
        updatePayload: { status: TermStatus.INACTIVE, isCurrent: false },
        transactionOptions: {
          useTransaction: false,
          transaction: undefined,
        },
      });
    });

    it('should use EntityManager when provided', async () => {
      termModelAction.update.mockResolvedValue(null);

      await service.archiveTermsBySessionId(sessionId, mockEntityManager);

      expect(termModelAction.update).toHaveBeenCalledWith({
        identifierOptions: { sessionId },
        updatePayload: { status: TermStatus.INACTIVE, isCurrent: false },
        transactionOptions: {
          useTransaction: true,
          transaction: mockEntityManager,
        },
      });
    });
  });
});
