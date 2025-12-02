import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import {
  DataSource,
  Repository,
  EntityManager,
  SelectQueryBuilder,
  In,
} from 'typeorm';
import { Logger } from 'winston';

// import * as sysMsg from '../../constants/system.messages'; // Assuming sysMsg is imported and used in the service file
import {
  Term,
  TermName,
  TermStatus,
} from '../academic-term/entities/term.entity'; // Added TermStatus
import { TermModelAction } from '../academic-term/model-actions';
import { Class } from '../class/entities/class.entity'; // Added Class entity
import { ClassModelAction } from '../class/model-actions/class.actions';

import { CreateFeesDto, QueryFeesDto, UpdateFeesDto } from './dto/fees.dto';
import { Fees } from './entities/fees.entity';
import { FeeStatus } from './enums/fees.enums';
import { FeesService } from './fees.service';
import { FeesModelAction } from './model-action/fees.model-action';

// FIX: Renamed interface to comply with ESLint rule: Interface name must have prefix 'I'
interface IMockUser {
  id: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  // Add other required fields from User entity if necessary
}

// Updated mock messages to match the exact strings thrown by the service
const mockSysMsg = {
  term_id_invalid: 'Invalid term ID.',
  invalid_class_ids: 'One or more class IDs are invalid',
  fee_not_found: 'Fees component not found',
};

type MockQueryBuilder = {
  leftJoinAndSelect: jest.Mock<MockQueryBuilder, [string, string]>;
  leftJoin: jest.Mock<MockQueryBuilder, [string, string]>;
  addSelect: jest.Mock<MockQueryBuilder, [string[]]>;
  orderBy: jest.Mock<MockQueryBuilder, [string, 'ASC' | 'DESC']>;
  andWhere: jest.Mock<MockQueryBuilder, [string, Record<string, unknown>?]>;
  skip: jest.Mock<MockQueryBuilder, [number]>;
  take: jest.Mock<MockQueryBuilder, [number]>;
  getCount: jest.Mock<Promise<number>, []>;
  getMany: jest.Mock<Promise<Fees[]>, []>;
};

describe('FeesService', () => {
  let service: FeesService;
  let feesModelAction: jest.Mocked<FeesModelAction>;
  let termModelAction: jest.Mocked<TermModelAction>;
  let classModelAction: jest.Mocked<ClassModelAction>;
  let logger: Partial<Logger>;
  let mockQueryBuilder: MockQueryBuilder;
  let mockFeesRepository: jest.Mocked<Repository<Fees>>;

  const mockLogger: Partial<Logger> = {
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

  const mockTerm: Term = {
    id: 'term-123',
    name: TermName.FIRST,
    sessionId: 'session-1',
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

  const mockCreator: IMockUser = {
    id: 'admin-user-123',
    first_name: 'Admin',
    last_name: 'User',
    middle_name: '',
  };

  // FIX: Casting mockCreator to the expected complex type (Fees['createdBy'])
  // using 'as unknown as ...' to eliminate the final 'as any' lint error.
  const mockFee: Fees = {
    id: 'fee-123',
    component_name: 'Tuition Fee',
    description: 'Quarterly tuition fee',
    amount: 5000,
    term_id: 'term-123',
    term: mockTerm,
    created_by: 'admin-user-123',
    classes: mockClasses,
    status: FeeStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: mockCreator as unknown as Fees['createdBy'], // FINAL FIX for line 134
  } as Fees;

  const mockFeesModelActionValue = {
    create: jest.fn(),
    get: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockTermModelActionValue = { get: jest.fn() };
  const mockClassModelActionValue = { find: jest.fn() };
  const mockDataSourceValue = { transaction: jest.fn() };

  beforeEach(async () => {
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
      getMany: jest.fn(),
    };

    mockFeesRepository = {
      createQueryBuilder: jest.fn(
        () => mockQueryBuilder as unknown as SelectQueryBuilder<Fees>,
      ),
    } as unknown as jest.Mocked<Repository<Fees>>;

    mockDataSourceValue.transaction = jest
      .fn()
      .mockImplementation(
        async (cb: (manager: EntityManager) => Promise<unknown>) =>
          cb(mockEntityManager as EntityManager),
      );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeesService,
        {
          provide: FeesModelAction,
          useValue: mockFeesModelActionValue,
        },
        { provide: TermModelAction, useValue: mockTermModelActionValue },
        { provide: ClassModelAction, useValue: mockClassModelActionValue },
        { provide: DataSource, useValue: mockDataSourceValue },
        { provide: getRepositoryToken(Fees), useValue: mockFeesRepository },
        { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<FeesService>(FeesService);
    feesModelAction = module.get(FeesModelAction);
    termModelAction = module.get(TermModelAction);
    classModelAction = module.get(ClassModelAction);
    logger = module.get(WINSTON_MODULE_PROVIDER);
  });

  afterEach(() => jest.clearAllMocks());

  // ================= CREATE =================
  describe('create', () => {
    const createFeesDto: CreateFeesDto = {
      component_name: 'Tuition Fee',
      description: 'Quarterly tuition fee',
      amount: 5000,
      term_id: 'term-123',
      class_ids: ['class-1'],
    };

    it('should create a fee successfully', async () => {
      (termModelAction.get as jest.Mock).mockResolvedValue(mockTerm);
      (classModelAction.find as jest.Mock).mockResolvedValue({
        payload: [mockClasses[0]],
        total: 1,
      });
      (feesModelAction.create as jest.Mock).mockResolvedValue(mockFee);

      const result = await service.create(createFeesDto, 'admin');

      expect(result).toEqual(mockFee);
      expect(feesModelAction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            component_name: createFeesDto.component_name,
            term_id: createFeesDto.term_id,
            classes: [mockClasses[0]],
          }),
          transactionOptions: {
            useTransaction: true,
            transaction: mockEntityManager,
          },
        }),
      );
      expect((logger as Logger).info).toHaveBeenCalledWith(
        'Fee component created successfully',
        expect.anything(),
      );
    });

    it('should throw BadRequestException if term does not exist', async () => {
      (termModelAction.get as jest.Mock).mockResolvedValue(null);
      await expect(service.create(createFeesDto, 'admin')).rejects.toThrow(
        new BadRequestException(mockSysMsg.term_id_invalid),
      );
    });

    it('should throw BadRequestException if class ids are invalid', async () => {
      (termModelAction.get as jest.Mock).mockResolvedValue(mockTerm);
      // Return fewer classes than requested
      (classModelAction.find as jest.Mock).mockResolvedValue({
        payload: [],
        total: 0,
      });
      await expect(service.create(createFeesDto, 'admin')).rejects.toThrow(
        new BadRequestException(mockSysMsg.invalid_class_ids),
      );
    });
  });

  // ================= FIND ALL =================
  describe('findAll', () => {
    const mockFees: Fees[] = [
      {
        ...mockFee,
        id: 'fee-1',
        classes: mockClasses,
      },
      {
        ...mockFee,
        id: 'fee-2',
        classes: [mockClasses[0]],
        component_name: 'Library Fee',
      },
    ];

    beforeEach(() => {
      (mockQueryBuilder.getCount as jest.Mock).mockResolvedValue(2);
      (mockQueryBuilder.getMany as jest.Mock).mockResolvedValue(mockFees);
    });

    it('should return all fees with default pagination and no filters', async () => {
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
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'fee.createdBy',
        'createdBy',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'fee.createdAt',
        'DESC',
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
      expect((logger as Logger).info).toHaveBeenCalled();
    });

    it('should filter by status when provided', async () => {
      const queryDto: QueryFeesDto = {
        page: 1,
        limit: 20,
        status: FeeStatus.INACTIVE,
      };

      await service.findAll(queryDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'fee.status = :status',
        { status: FeeStatus.INACTIVE },
      );
    });

    it('should filter by term_id when provided', async () => {
      const queryDto: QueryFeesDto = {
        page: 1,
        limit: 20,
        term_id: 'term-456',
      };

      await service.findAll(queryDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'fee.term_id = :term_id',
        { term_id: 'term-456' },
      );
    });

    it('should filter by class_id when provided', async () => {
      const queryDto: QueryFeesDto = {
        page: 1,
        limit: 20,
        class_id: 'class-1',
      };

      await service.findAll(queryDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'classes.id = :class_id',
        { class_id: 'class-1' },
      );
    });

    it('should filter by search term on component_name or description', async () => {
      const queryDto: QueryFeesDto = {
        page: 1,
        limit: 20,
        search: 'tuition',
      };

      await service.findAll(queryDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(fee.component_name ILIKE :search OR fee.description ILIKE :search)',
        { search: `%tuition%` },
      );
    });

    it('should calculate totalPages correctly for multiple pages', async () => {
      (mockQueryBuilder.getCount as jest.Mock).mockResolvedValue(25);
      const queryDto: QueryFeesDto = { page: 2, limit: 10 };

      const result = await service.findAll(queryDto);

      expect(result.totalPages).toBe(3);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });
  });

  // ================= UPDATE =================
  describe('update', () => {
    const updateDto: UpdateFeesDto = {
      component_name: 'Updated Fee',
      term_id: 'new-term-123',
    };

    it('should update fee successfully', async () => {
      (feesModelAction.get as jest.Mock).mockResolvedValue({
        ...mockFee,
        classes: [],
      });
      (termModelAction.get as jest.Mock).mockResolvedValue({
        id: 'new-term-123',
      });
      (feesModelAction.save as jest.Mock).mockImplementation((options) =>
        Promise.resolve({
          ...options.entity,
          component_name: 'Updated Fee',
        }),
      );

      const result = await service.update('fee-123', updateDto);

      expect(result.component_name).toBe('Updated Fee');
      expect(result.term_id).toBe('new-term-123');
      expect(feesModelAction.save).toHaveBeenCalled();
      expect((logger as Logger).info).toHaveBeenCalled();
    });

    it('should throw NotFoundException if fee not found', async () => {
      (feesModelAction.get as jest.Mock).mockResolvedValue(null);
      await expect(service.update('fee-123', updateDto)).rejects.toThrow(
        new NotFoundException(mockSysMsg.fee_not_found),
      );
    });

    it('should throw BadRequestException if new term_id is invalid', async () => {
      (feesModelAction.get as jest.Mock).mockResolvedValue(mockFee);
      (termModelAction.get as jest.Mock).mockResolvedValue(null);

      await expect(
        service.update('fee-123', { term_id: 'non-existent-term' }),
      ).rejects.toThrow(new BadRequestException(mockSysMsg.term_id_invalid));
    });

    it('should update classes successfully', async () => {
      const updatedClasses: Class[] = [mockClasses[1]];
      const updateClassDto: UpdateFeesDto = { class_ids: ['class-2'] };

      (feesModelAction.get as jest.Mock).mockResolvedValue({
        ...mockFee,
        classes: mockClasses,
      });
      (classModelAction.find as jest.Mock).mockResolvedValue({
        payload: updatedClasses,
        total: 1,
      });
      (feesModelAction.save as jest.Mock).mockImplementation((options) =>
        Promise.resolve({
          ...options.entity,
          classes: updatedClasses,
        }),
      );

      const result = await service.update('fee-123', updateClassDto);

      expect(classModelAction.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: { id: In(['class-2']) },
        }),
      );
      expect(result.classes).toEqual(updatedClasses);
      expect((logger as Logger).info).toHaveBeenCalled();
    });
  });

  // ================= FIND ONE =================
  describe('findOne', () => {
    it('should return a fee with limited createdBy fields', async () => {
      const mockFeeWithCreator = {
        ...mockFee,
        createdBy: {
          id: 'user-1',
          first_name: 'John',
          last_name: 'Doe',
          middle_name: 'M',
        } as IMockUser, // Casting here to IMockUser to ensure type safety in the test file
      };
      (feesModelAction.get as jest.Mock).mockResolvedValue(mockFeeWithCreator);

      const result = await service.findOne('fee-123');

      expect(feesModelAction.get).toHaveBeenCalledWith(
        expect.objectContaining({
          identifierOptions: { id: 'fee-123' },
          relations: { classes: true, term: true, createdBy: true },
        }),
      );
      expect(result.createdBy).toEqual({
        id: 'user-1',
        first_name: 'John',
        last_name: 'Doe',
        middle_name: 'M',
      });
    });

    it('should throw NotFoundException if fee not found', async () => {
      (feesModelAction.get as jest.Mock).mockResolvedValue(null);
      await expect(service.findOne('fee-123')).rejects.toThrow(
        new NotFoundException(mockSysMsg.fee_not_found),
      );
    });
  });

  // ================= DEACTIVATE =================
  describe('deactivate', () => {
    const feeId = 'fee-123';
    const deactivatedBy = 'admin';
    const reason = 'Budget cut';

    it('should deactivate an active fee successfully', async () => {
      const activeFee = { ...mockFee, status: FeeStatus.ACTIVE };
      const inactiveFee = { ...mockFee, status: FeeStatus.INACTIVE };

      (feesModelAction.get as jest.Mock).mockResolvedValue(activeFee);
      (feesModelAction.update as jest.Mock).mockResolvedValue(inactiveFee);

      const result = await service.deactivate(feeId, deactivatedBy, reason);

      expect(feesModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: feeId },
      });

      expect(feesModelAction.update).toHaveBeenCalledWith({
        identifierOptions: { id: feeId },
        updatePayload: { status: FeeStatus.INACTIVE },
        transactionOptions: {
          useTransaction: false,
        },
      });

      expect((logger as Logger).info).toHaveBeenCalledWith(
        'Fee component deactivated successfully',
        expect.objectContaining({
          fee_id: feeId,
          deactivated_by: deactivatedBy,
          reason: reason,
          previous_status: FeeStatus.ACTIVE,
          new_status: FeeStatus.INACTIVE,
        }),
      );
      expect(result.status).toBe(FeeStatus.INACTIVE);
    });

    it('should return idempotent success for already inactive fee', async () => {
      const inactiveFee = { ...mockFee, status: FeeStatus.INACTIVE };

      (feesModelAction.get as jest.Mock).mockResolvedValue(inactiveFee);

      const result = await service.deactivate(feeId, deactivatedBy);

      expect(feesModelAction.get).toHaveBeenCalled();
      expect(feesModelAction.update).not.toHaveBeenCalled();

      expect((logger as Logger).info).toHaveBeenCalledWith(
        'Fee component is already inactive',
        expect.objectContaining({
          fee_id: feeId,
          deactivated_by: deactivatedBy,
        }),
      );
      expect(result.status).toBe(FeeStatus.INACTIVE);
    });

    it('should throw NotFoundException if fee not found', async () => {
      (feesModelAction.get as jest.Mock).mockResolvedValue(null);
      await expect(
        service.deactivate(feeId, deactivatedBy, reason),
      ).rejects.toThrow(new NotFoundException(mockSysMsg.fee_not_found));

      expect(feesModelAction.update).not.toHaveBeenCalled();
    });
  });

  // ================= ACTIVATE =================
  describe('activate', () => {
    const feeId = 'fee-123';
    const activatedBy = 'admin-user-123';

    it('should activate an inactive fee successfully', async () => {
      const inactiveFee = { ...mockFee, status: FeeStatus.INACTIVE };
      const activeFee = { ...mockFee, status: FeeStatus.ACTIVE };

      (feesModelAction.get as jest.Mock).mockResolvedValue(inactiveFee);
      (feesModelAction.update as jest.Mock).mockResolvedValue(activeFee);

      const result = await service.activate(feeId, activatedBy);

      expect(feesModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: feeId },
      });

      expect(feesModelAction.update).toHaveBeenCalledWith({
        identifierOptions: { id: feeId },
        updatePayload: { status: FeeStatus.ACTIVE },
        transactionOptions: {
          useTransaction: false,
        },
      });

      expect((logger as Logger).info).toHaveBeenCalledWith(
        'Fee component activated successfully',
        expect.objectContaining({
          fee_id: feeId,
          activated_by: activatedBy,
          previous_status: FeeStatus.INACTIVE,
          new_status: FeeStatus.ACTIVE,
        }),
      );
      expect(result.status).toBe(FeeStatus.ACTIVE);
    });

    it('should return idempotent success for already active fee', async () => {
      const activeFee = { ...mockFee, status: FeeStatus.ACTIVE };

      (feesModelAction.get as jest.Mock).mockResolvedValue(activeFee);

      const result = await service.activate(feeId, activatedBy);

      expect(feesModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: feeId },
      });
      expect(feesModelAction.update).not.toHaveBeenCalled();

      expect((logger as Logger).info).toHaveBeenCalledWith(
        'Fee component is already active',
        expect.objectContaining({
          fee_id: feeId,
          activated_by: activatedBy,
        }),
      );
      expect(result.status).toBe(FeeStatus.ACTIVE);
    });

    it('should throw NotFoundException when fee does not exist', async () => {
      (feesModelAction.get as jest.Mock).mockResolvedValue(null);

      await expect(service.activate(feeId, activatedBy)).rejects.toThrow(
        new NotFoundException(mockSysMsg.fee_not_found),
      );

      expect(feesModelAction.update).not.toHaveBeenCalled();
    });
  });
});
