import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource, EntityManager, SelectQueryBuilder } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../constants/system.messages';
import {
  Term,
  TermName,
  TermStatus,
} from '../academic-term/entities/term.entity';
import { TermModelAction } from '../academic-term/model-actions';
import { Class } from '../class/entities/class.entity';
import { ClassModelAction } from '../class/model-actions/class.actions';

import { CreateFeesDto, QueryFeesDto, UpdateFeesDto } from './dto/fees.dto';
import { Fees } from './entities/fees.entity';
import { FeeStatus } from './enums/fees.enums';
import { FeesService } from './fees.service';
import { FeesModelAction } from './model-action/fees.model-action';

describe('FeesService', () => {
  let service: FeesService;
  let dataSource: jest.Mocked<DataSource>;
  let feesModelAction: jest.Mocked<FeesModelAction>;
  let termModelAction: jest.Mocked<TermModelAction>;
  let classModelAction: jest.Mocked<ClassModelAction>;
  let logger: Logger;

  const mockLogger = {
    child: jest.fn().mockReturnThis(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const mockEntityManager: Partial<EntityManager> = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockFeesModelAction = {
    create: jest.fn(),
    get: jest.fn(),
    save: jest.fn(),
  };

  const mockFeesRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockTermModelAction = {
    get: jest.fn(),
  };

  const mockClassModelAction = {
    find: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeesService,
        {
          provide: FeesModelAction,
          useValue: mockFeesModelAction,
        },
        {
          provide: TermModelAction,
          useValue: mockTermModelAction,
        },
        {
          provide: ClassModelAction,
          useValue: mockClassModelAction,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: getRepositoryToken(Fees),
          useValue: mockFeesRepository,
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<FeesService>(FeesService);
    dataSource = module.get(DataSource);
    feesModelAction = module.get(FeesModelAction);
    termModelAction = module.get(TermModelAction);
    classModelAction = module.get(ClassModelAction);
    logger = module.get(WINSTON_MODULE_PROVIDER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createFeesDto: CreateFeesDto = {
      component_name: 'Tuition Fee',
      description: 'Quarterly tuition fee',
      amount: 5000,
      term_id: 'term-123',
      class_ids: ['class-1', 'class-2'],
    };

    const createdBy = 'admin-user-123';

    const mockTerm: Term = {
      id: 'term-123',
      name: TermName.FIRST,
      sessionId: 'session-123',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-04-30'),
      status: TermStatus.ACTIVE,
      isCurrent: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Term;

    const mockClasses: Class[] = [
      {
        id: 'class-1',
        name: 'Grade 1',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Class,
      {
        id: 'class-2',
        name: 'Grade 2',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Class,
    ];

    const mockSavedFee: Fees = {
      id: 'fee-123',
      component_name: 'Tuition Fee',
      description: 'Quarterly tuition fee',
      amount: 5000,
      term_id: 'term-123',
      term: mockTerm,
      created_by: createdBy,
      classes: mockClasses,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Fees;

    beforeEach(() => {
      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockEntityManager as EntityManager);
      });
    });

    it('should create a fee successfully', async () => {
      mockTermModelAction.get.mockResolvedValue(mockTerm);
      mockClassModelAction.find.mockResolvedValue({
        payload: mockClasses,
        total: mockClasses.length,
      });
      mockFeesModelAction.create.mockResolvedValue(mockSavedFee);

      const result = await service.create(createFeesDto, createdBy);

      expect(dataSource.transaction).toHaveBeenCalledWith(expect.any(Function));
      expect(termModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: createFeesDto.term_id },
      });
      expect(classModelAction.find).toHaveBeenCalledWith({
        findOptions: { id: expect.any(Object) },
        transactionOptions: {
          useTransaction: true,
          transaction: mockEntityManager,
        },
      });
      expect(feesModelAction.create).toHaveBeenCalledWith({
        createPayload: {
          component_name: createFeesDto.component_name,
          description: createFeesDto.description,
          amount: createFeesDto.amount,
          term_id: createFeesDto.term_id,
          created_by: createdBy,
          classes: mockClasses,
        },
        transactionOptions: {
          useTransaction: true,
          transaction: mockEntityManager,
        },
      });
      expect(logger.info).toHaveBeenCalledWith(
        'Fee component created successfully',
        {
          fee_id: mockSavedFee.id,
          component_name: mockSavedFee.component_name,
          amount: mockSavedFee.amount,
          term: mockSavedFee.term,
          class_count: mockClasses.length,
          created_by: createdBy,
        },
      );
      expect(result).toEqual(mockSavedFee);
    });

    it('should throw BadRequestException when term does not exist', async () => {
      mockTermModelAction.get.mockResolvedValue(null);

      await expect(service.create(createFeesDto, createdBy)).rejects.toThrow(
        new BadRequestException(sysMsg.TERM_ID_INVALID),
      );

      expect(termModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: createFeesDto.term_id },
      });
      expect(classModelAction.find).not.toHaveBeenCalled();
      expect(feesModelAction.create).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when class IDs are invalid', async () => {
      mockTermModelAction.get.mockResolvedValue(mockTerm);
      mockClassModelAction.find.mockResolvedValue({
        payload: [mockClasses[0]],
        total: 1,
      });

      await expect(service.create(createFeesDto, createdBy)).rejects.toThrow(
        new BadRequestException(sysMsg.INVALID_CLASS_IDS),
      );

      expect(termModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: createFeesDto.term_id },
      });
      expect(classModelAction.find).toHaveBeenCalledWith({
        findOptions: { id: expect.any(Object) },
        transactionOptions: {
          useTransaction: true,
          transaction: mockEntityManager,
        },
      });
      expect(feesModelAction.create).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when no classes are found', async () => {
      mockTermModelAction.get.mockResolvedValue(mockTerm);
      mockClassModelAction.find.mockResolvedValue({
        payload: [],
        total: 0,
      });

      await expect(service.create(createFeesDto, createdBy)).rejects.toThrow(
        new BadRequestException(sysMsg.INVALID_CLASS_IDS),
      );

      expect(classModelAction.find).toHaveBeenCalledWith({
        findOptions: { id: expect.any(Object) },
        transactionOptions: {
          useTransaction: true,
          transaction: mockEntityManager,
        },
      });
      expect(feesModelAction.create).not.toHaveBeenCalled();
    });

    it('should handle database errors during transaction', async () => {
      const dbError = new Error('Database connection failed');
      mockTermModelAction.get.mockRejectedValue(dbError);

      await expect(service.create(createFeesDto, createdBy)).rejects.toThrow(
        dbError,
      );

      expect(logger.info).not.toHaveBeenCalled();
    });

    it('should create fee with empty description', async () => {
      const dtoWithoutDescription = {
        ...createFeesDto,
        description: '',
      };

      const savedFeeWithEmptyDesc = {
        ...mockSavedFee,
        description: '',
      };

      mockTermModelAction.get.mockResolvedValue(mockTerm);
      mockClassModelAction.find.mockResolvedValue({
        payload: mockClasses,
        total: mockClasses.length,
      });
      mockFeesModelAction.create.mockResolvedValue(savedFeeWithEmptyDesc);

      const result = await service.create(dtoWithoutDescription, createdBy);

      expect(result.description).toBe('');
      expect(logger.info).toHaveBeenCalled();
    });

    it('should handle single class ID', async () => {
      const singleClassDto = {
        ...createFeesDto,
        class_ids: ['class-1'],
      };

      const singleClass = [mockClasses[0]];

      mockTermModelAction.get.mockResolvedValue(mockTerm);
      mockClassModelAction.find.mockResolvedValue({
        payload: singleClass,
        total: 1,
      });
      mockFeesModelAction.create.mockResolvedValue(mockSavedFee);

      const result = await service.create(singleClassDto, createdBy);

      expect(result).toEqual(mockSavedFee);
      expect(logger.info).toHaveBeenCalledWith(
        'Fee component created successfully',
        expect.objectContaining({
          class_count: 1,
        }),
      );
    });
  });

  describe('findAll', () => {
    let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<Fees>>;

    const mockTerm: Term = {
      id: 'term-123',
      name: TermName.FIRST,
      sessionId: 'session-123',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-04-30'),
      status: TermStatus.ACTIVE,
      isCurrent: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Term;

    const mockClasses: Class[] = [
      {
        id: 'class-1',
        name: 'Grade 1',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Class,
      {
        id: 'class-2',
        name: 'Grade 2',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Class,
    ];

    const mockFees: Fees[] = [
      {
        id: 'fee-1',
        component_name: 'Tuition Fee',
        description: 'Quarterly tuition fee',
        amount: 5000,
        term_id: 'term-123',
        term: mockTerm,
        classes: mockClasses,
        status: FeeStatus.ACTIVE,
        created_by: 'admin-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Fees,
      {
        id: 'fee-2',
        component_name: 'Library Fee',
        description: 'Library access fee',
        amount: 1000,
        term_id: 'term-123',
        term: mockTerm,
        classes: [mockClasses[0]],
        status: FeeStatus.ACTIVE,
        created_by: 'admin-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Fees,
    ];

    beforeEach(() => {
      mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn(),
        getMany: jest.fn(),
      } as unknown as jest.Mocked<SelectQueryBuilder<Fees>>;

      mockFeesRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);
    });

    it('should return all active fees by default', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(2);
      mockQueryBuilder.getMany.mockResolvedValue(mockFees);

      const queryDto: QueryFeesDto = {
        page: 1,
        limit: 20,
      };

      const result = await service.findAll(queryDto);

      expect(mockFeesRepository.createQueryBuilder).toHaveBeenCalledWith('fee');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'fee.term',
        'term',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'fee.classes',
        'classes',
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'fee.createdAt',
        'DESC',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'fee.status = :status',
        { status: FeeStatus.ACTIVE },
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
      expect(result).toEqual({
        fees: mockFees,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(logger.info).toHaveBeenCalledWith(
        'Fetched fee components',
        expect.objectContaining({
          total: 2,
          page: 1,
          limit: 20,
        }),
      );
    });

    it('should filter by status when provided', async () => {
      const inactiveFees = [
        {
          ...mockFees[0],
          status: FeeStatus.INACTIVE,
        },
      ];
      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue(inactiveFees);

      const queryDto: QueryFeesDto = {
        status: FeeStatus.INACTIVE,
        page: 1,
        limit: 20,
      };

      const result = await service.findAll(queryDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'fee.status = :status',
        { status: FeeStatus.INACTIVE },
      );
      expect(result.fees).toEqual(inactiveFees);
      expect(result.total).toBe(1);
    });

    it('should filter by term_id when provided', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(2);
      mockQueryBuilder.getMany.mockResolvedValue(mockFees);

      const queryDto: QueryFeesDto = {
        term_id: 'term-123',
        page: 1,
        limit: 20,
      };

      await service.findAll(queryDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'fee.term_id = :term_id',
        { term_id: 'term-123' },
      );
    });

    it('should filter by class_id when provided', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue([mockFees[0]]);

      const queryDto: QueryFeesDto = {
        class_id: 'class-1',
        page: 1,
        limit: 20,
      };

      await service.findAll(queryDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'classes.id = :class_id',
        { class_id: 'class-1' },
      );
    });

    it('should filter by search term when provided', async () => {
      const searchResults = [mockFees[0]];
      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue(searchResults);

      const queryDto: QueryFeesDto = {
        search: 'tuition',
        page: 1,
        limit: 20,
      };

      await service.findAll(queryDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(fee.component_name ILIKE :search OR fee.description ILIKE :search)',
        { search: '%tuition%' },
      );
    });

    it('should handle pagination correctly', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(50);
      mockQueryBuilder.getMany.mockResolvedValue(mockFees);

      const queryDto: QueryFeesDto = {
        page: 2,
        limit: 10,
      };

      const result = await service.findAll(queryDto);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(result.totalPages).toBe(5);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });

    it('should combine multiple filters', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue([mockFees[0]]);

      const queryDto: QueryFeesDto = {
        status: FeeStatus.ACTIVE,
        term_id: 'term-123',
        class_id: 'class-1',
        search: 'tuition',
        page: 1,
        limit: 20,
      };

      await service.findAll(queryDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(4);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'fee.status = :status',
        { status: FeeStatus.ACTIVE },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'fee.term_id = :term_id',
        { term_id: 'term-123' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'classes.id = :class_id',
        { class_id: 'class-1' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(fee.component_name ILIKE :search OR fee.description ILIKE :search)',
        { search: '%tuition%' },
      );
    });

    it('should handle empty search term gracefully', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(2);
      mockQueryBuilder.getMany.mockResolvedValue(mockFees);

      const queryDto: QueryFeesDto = {
        search: '   ',
        page: 1,
        limit: 20,
      };

      await service.findAll(queryDto);

      // Should not call andWhere for search when search is empty/whitespace
      const searchCalls = mockQueryBuilder.andWhere.mock.calls.filter(
        (call) => {
          const firstArg = call[0];
          return typeof firstArg === 'string' && firstArg.includes('ILIKE');
        },
      );
      expect(searchCalls).toHaveLength(0);
    });

    it('should handle zero results', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const queryDto: QueryFeesDto = {
        page: 1,
        limit: 20,
      };

      const result = await service.findAll(queryDto);

      expect(result.fees).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should use default pagination values when not provided', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(2);
      mockQueryBuilder.getMany.mockResolvedValue(mockFees);

      const queryDto: QueryFeesDto = {};

      const result = await service.findAll(queryDto);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should calculate totalPages correctly for odd totals', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(25);
      mockQueryBuilder.getMany.mockResolvedValue(mockFees);

      const queryDto: QueryFeesDto = {
        page: 1,
        limit: 10,
      };

      const result = await service.findAll(queryDto);

      expect(result.totalPages).toBe(3); // Math.ceil(25/10) = 3
    });
  });

  describe('update', () => {
    const feeId = 'fee-123';
    const updateFeesDto: UpdateFeesDto = {
      component_name: 'Updated Tuition Fee',
      description: 'Updated description',
      amount: 6000,
      term_id: 'term-456',
      class_ids: ['class-3'],
      status: FeeStatus.INACTIVE,
    };

    const mockExistingFee: Fees = {
      id: feeId,
      component_name: 'Tuition Fee',
      description: 'Quarterly tuition fee',
      amount: 5000,
      term_id: 'term-123',
      classes: [{ id: 'class-1', name: 'Grade 1' } as Class],
      status: FeeStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Fees;

    const mockTerm: Term = {
      id: 'term-456',
      name: TermName.SECOND,
      status: TermStatus.ACTIVE,
    } as Term;

    const mockClasses: Class[] = [{ id: 'class-3', name: 'Grade 3' } as Class];

    beforeEach(() => {
      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockEntityManager as EntityManager);
      });
    });

    it('should update a fee successfully', async () => {
      const mockSave = jest.fn().mockResolvedValue({
        ...mockExistingFee,
        ...updateFeesDto,
        classes: mockClasses,
      });

      mockFeesModelAction.get.mockResolvedValue(mockExistingFee);
      mockTermModelAction.get.mockResolvedValue(mockTerm);
      mockClassModelAction.find.mockResolvedValue({
        payload: mockClasses,
        total: 1,
      });
      mockFeesModelAction.save = mockSave;

      const result = await service.update(feeId, updateFeesDto);

      expect(feesModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: feeId },
        relations: { classes: true },
      });
      expect(termModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: updateFeesDto.term_id },
      });
      expect(classModelAction.find).toHaveBeenCalledWith({
        findOptions: { id: expect.any(Object) },
        transactionOptions: {
          useTransaction: true,
          transaction: mockEntityManager,
        },
      });
      expect(mockSave).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        'Fee component updated successfully',
        expect.objectContaining({
          fee_id: feeId,
        }),
      );
      expect(result).toMatchObject(updateFeesDto);
    });

    it('should throw NotFoundException when fee does not exist', async () => {
      mockFeesModelAction.get.mockResolvedValue(null);

      await expect(service.update(feeId, updateFeesDto)).rejects.toThrow(
        new NotFoundException(sysMsg.FEE_NOT_FOUND),
      );

      expect(feesModelAction.get).toHaveBeenCalled();
      expect(termModelAction.get).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when term_id is invalid', async () => {
      mockFeesModelAction.get.mockResolvedValue(mockExistingFee);
      mockTermModelAction.get.mockResolvedValue(null);

      await expect(service.update(feeId, updateFeesDto)).rejects.toThrow(
        new BadRequestException(sysMsg.TERM_ID_INVALID),
      );

      expect(termModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: updateFeesDto.term_id },
      });
    });

    it('should throw BadRequestException when class_ids are invalid', async () => {
      mockFeesModelAction.get.mockResolvedValue(mockExistingFee);
      mockTermModelAction.get.mockResolvedValue(mockTerm);
      mockClassModelAction.find.mockResolvedValue({
        payload: [],
        total: 0,
      });

      await expect(service.update(feeId, updateFeesDto)).rejects.toThrow(
        new BadRequestException(sysMsg.INVALID_CLASS_IDS),
      );
    });

    it('should update only provided fields', async () => {
      const partialUpdate = { amount: 7000 };
      const mockSave = jest.fn().mockResolvedValue({
        ...mockExistingFee,
        amount: 7000,
      });

      mockFeesModelAction.get.mockResolvedValue(mockExistingFee);
      mockFeesModelAction.save = mockSave;

      const result = await service.update(feeId, partialUpdate);

      expect(result.amount).toBe(7000);
      expect(termModelAction.get).not.toHaveBeenCalled();
      expect(classModelAction.find).not.toHaveBeenCalled();
    });

    it('should not validate term if term_id is not provided', async () => {
      const updateWithoutTerm = { amount: 7000 };
      const mockSave = jest.fn().mockResolvedValue({
        ...mockExistingFee,
        amount: 7000,
      });

      mockFeesModelAction.get.mockResolvedValue(mockExistingFee);
      mockFeesModelAction.save = mockSave;

      await service.update(feeId, updateWithoutTerm);

      expect(termModelAction.get).not.toHaveBeenCalled();
    });

    it('should not validate classes if class_ids are not provided', async () => {
      const updateWithoutClasses = { component_name: 'New Name' };
      const mockSave = jest.fn().mockResolvedValue({
        ...mockExistingFee,
        component_name: 'New Name',
      });

      mockFeesModelAction.get.mockResolvedValue(mockExistingFee);
      mockFeesModelAction.save = mockSave;

      await service.update(feeId, updateWithoutClasses);

      expect(classModelAction.find).not.toHaveBeenCalled();
    });
  });
});
