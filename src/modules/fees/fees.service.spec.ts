import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource, EntityManager } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../constants/system.messages';
import { Term, TermName } from '../academic-term/entities/term.entity';
import { Class } from '../class/entities/class.entity';

import { CreateFeesDto } from './dto/fees.dto';
import { Fees } from './entities/fees.entity';
import { FeesService } from './fees.service';
import { FeesModelAction } from './model-action/fees.model-action';

describe('FeesService', () => {
  let service: FeesService;
  let dataSource: jest.Mocked<DataSource>;
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

  const mockFeeModelAction = {
    create: jest.fn(),
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
          useValue: mockFeeModelAction,
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

    const mockTerm: Partial<Term> = {
      id: 'term-123',
      name: TermName.FIRST,
    };

    const mockClasses: Partial<Class>[] = [
      { id: 'class-1', name: 'Grade 1' },
      { id: 'class-2', name: 'Grade 2' },
    ];

    const mockSavedFee: Partial<Fees> = {
      id: 'fee-123',
      component_name: 'Tuition Fee',
      description: 'Quarterly tuition fee',
      amount: 5000,
      term_id: 'term-123',
      term: mockTerm as Term,
      created_by: createdBy,
      classes: mockClasses as Class[],
    };

    beforeEach(() => {
      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockEntityManager as EntityManager);
      });
    });

    it('should create a fee successfully', async () => {
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(mockTerm);
      (mockEntityManager.find as jest.Mock).mockResolvedValue(mockClasses);
      (mockEntityManager.create as jest.Mock).mockReturnValue(mockSavedFee);
      (mockEntityManager.save as jest.Mock).mockResolvedValue(mockSavedFee);

      const result = await service.create(createFeesDto, createdBy);

      expect(dataSource.transaction).toHaveBeenCalledWith(expect.any(Function));
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(Term, {
        where: { id: createFeesDto.term_id },
      });
      expect(mockEntityManager.find).toHaveBeenCalledWith(Class, {
        where: { id: expect.any(Object) },
      });
      expect(mockEntityManager.create).toHaveBeenCalledWith(Fees, {
        component_name: createFeesDto.component_name,
        description: createFeesDto.description,
        amount: createFeesDto.amount,
        term_id: createFeesDto.term_id,
        created_by: createdBy,
        classes: mockClasses,
      });
      expect(mockEntityManager.save).toHaveBeenCalledWith(Fees, mockSavedFee);
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
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.create(createFeesDto, createdBy)).rejects.toThrow(
        new BadRequestException('Invalid term ID'),
      );

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(Term, {
        where: { id: createFeesDto.term_id },
      });
      expect(mockEntityManager.find).not.toHaveBeenCalled();
      expect(mockEntityManager.create).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when class IDs are invalid', async () => {
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(mockTerm);
      (mockEntityManager.find as jest.Mock).mockResolvedValue([mockClasses[0]]);

      await expect(service.create(createFeesDto, createdBy)).rejects.toThrow(
        new BadRequestException(sysMsg.INVALID_CLASS_IDS),
      );

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(Term, {
        where: { id: createFeesDto.term_id },
      });
      expect(mockEntityManager.find).toHaveBeenCalledWith(Class, {
        where: { id: expect.any(Object) },
      });
      expect(mockEntityManager.create).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when no classes are found', async () => {
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(mockTerm);
      (mockEntityManager.find as jest.Mock).mockResolvedValue([]);

      await expect(service.create(createFeesDto, createdBy)).rejects.toThrow(
        new BadRequestException(sysMsg.INVALID_CLASS_IDS),
      );

      expect(mockEntityManager.find).toHaveBeenCalledWith(Class, {
        where: { id: expect.any(Object) },
      });
      expect(mockEntityManager.create).not.toHaveBeenCalled();
    });

    it('should handle database errors during transaction', async () => {
      const dbError = new Error('Database connection failed');
      (mockEntityManager.findOne as jest.Mock).mockRejectedValue(dbError);

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

      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(mockTerm);
      (mockEntityManager.find as jest.Mock).mockResolvedValue(mockClasses);
      (mockEntityManager.create as jest.Mock).mockReturnValue(
        savedFeeWithEmptyDesc,
      );
      (mockEntityManager.save as jest.Mock).mockResolvedValue(
        savedFeeWithEmptyDesc,
      );

      const result = await service.create(dtoWithoutDescription, createdBy);

      expect(result.description).toBe('');
      expect(logger.info).toHaveBeenCalled();
    });

    it('should handle single class ID', async () => {
      const singleClassDto = {
        ...createFeesDto,
        class_ids: ['class-1'],
      };

      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(mockTerm);
      (mockEntityManager.find as jest.Mock).mockResolvedValue([mockClasses[0]]);
      (mockEntityManager.create as jest.Mock).mockReturnValue(mockSavedFee);
      (mockEntityManager.save as jest.Mock).mockResolvedValue(mockSavedFee);

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
