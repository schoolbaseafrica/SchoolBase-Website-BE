import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource, EntityManager } from 'typeorm';
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

import { CreateFeesDto } from './dto/fees.dto';
import { Fees } from './entities/fees.entity';
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
});
