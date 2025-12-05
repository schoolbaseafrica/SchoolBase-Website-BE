import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { In } from 'typeorm';
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
import { FeeNotificationService } from '../notification/services';

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

describe('FeesService', () => {
  let service: FeesService;
  let feesModelAction: jest.Mocked<FeesModelAction>;
  let termModelAction: jest.Mocked<TermModelAction>;
  let classModelAction: jest.Mocked<ClassModelAction>;
  let logger: Partial<Logger>;

  const mockLogger: Partial<Logger> = {
    child: jest.fn().mockReturnThis(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
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
    find: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    get: jest.fn(),
    getFeeWithStudentAssignments: jest.fn(),
    findAllFees: jest.fn(),
    getActiveFeeComponents: jest.fn(),
  };

  const mockTermModelActionValue = { get: jest.fn() };
  const mockClassModelActionValue = { find: jest.fn() };
  const mockFeeNotificationService = {
    createAndUpdateFeesNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeesService,
        {
          provide: FeesModelAction,
          useValue: mockFeesModelActionValue,
        },
        { provide: TermModelAction, useValue: mockTermModelActionValue },
        { provide: ClassModelAction, useValue: mockClassModelActionValue },
        {
          provide: FeeNotificationService,
          useValue: mockFeeNotificationService,
        },
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
            useTransaction: false,
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
      (feesModelAction.findAllFees as jest.Mock).mockResolvedValue({
        fees: mockFees,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should return all fees with default pagination and no filters', async () => {
      const queryDto: QueryFeesDto = {
        page: 1,
        limit: 20,
      };

      const result = await service.findAll(queryDto);

      expect(feesModelAction.findAllFees).toHaveBeenCalledWith(queryDto);

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

      const mockResult = {
        fees: [mockFee],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      (feesModelAction.findAllFees as jest.Mock).mockResolvedValue(mockResult);

      await service.findAll(queryDto);

      expect(feesModelAction.findAllFees).toHaveBeenCalledWith(queryDto);
    });

    it('should filter by term_id when provided', async () => {
      const queryDto: QueryFeesDto = {
        page: 1,
        limit: 20,
        term_id: 'term-456',
      };

      const mockResult = {
        fees: [mockFee],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      (feesModelAction.findAllFees as jest.Mock).mockResolvedValue(mockResult);

      await service.findAll(queryDto);

      expect(feesModelAction.findAllFees).toHaveBeenCalledWith(queryDto);
    });

    const mockQueryDto: QueryFeesDto = {
      page: 1,
      limit: 20,
    };

    it('should apply filters correctly', async () => {
      const queryWithFilters: QueryFeesDto = {
        ...mockQueryDto,
        status: FeeStatus.ACTIVE,
        class_id: 'class-123',
        term_id: 'term-123',
        search: 'tuition',
      };

      const mockResult = {
        fees: [mockFee],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      (feesModelAction.findAllFees as jest.Mock).mockResolvedValue(mockResult);

      await service.findAll(queryWithFilters);

      expect(feesModelAction.findAllFees).toHaveBeenCalledWith(
        queryWithFilters,
      );
    });

    it('should return paginated fees', async () => {
      const mockResult = {
        fees: [mockFee],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      (feesModelAction.findAllFees as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.findAll(mockQueryDto);

      expect(feesModelAction.findAllFees).toHaveBeenCalledWith(mockQueryDto);
      expect(result).toEqual(mockResult);
    });

    it('should calculate totalPages correctly for multiple pages', async () => {
      const mockResult = {
        fees: mockFees,
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
      };
      const queryDto: QueryFeesDto = { page: 2, limit: 10 };

      (feesModelAction.findAllFees as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.findAll(queryDto);

      expect(feesModelAction.findAllFees).toHaveBeenCalledWith(queryDto);
      expect(result.totalPages).toBe(3);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
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

  // ================= GET STUDENTS FOR FEE =================
  describe('getStudentsForFee', () => {
    it('should return students from linked classes and direct assignments', async () => {
      const mockStudent1 = {
        id: 'student-1',
        registration_number: 'REG001',
        photo_url: 'photo1.jpg',
        user: { first_name: 'John', last_name: 'Doe' },
      };
      const mockStudent2 = {
        id: 'student-2',
        registration_number: 'REG002',
        photo_url: 'photo2.jpg',
        user: { first_name: 'Jane', last_name: 'Smith' },
      };

      const mockFeeWithStudents = {
        ...mockFee,
        classes: [
          {
            name: 'Class 1',
            academicSession: { academicYear: '2023/2024' },
            student_assignments: [{ student: mockStudent1 }],
          },
        ],
        direct_assignments: [{ student: mockStudent2 }],
      };

      (
        feesModelAction.getFeeWithStudentAssignments as jest.Mock
      ).mockResolvedValue(mockFeeWithStudents);

      const result = await service.getStudentsForFee('fee-123');

      expect(result).toHaveLength(2);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'student-1',
            name: 'John Doe',
            class: 'Class 1',
            session: '2023/2024',
          }),
          expect.objectContaining({
            id: 'student-2',
            name: 'Jane Smith',
            class: 'N/A',
            session: '',
          }),
        ]),
      );
    });

    it('should deduplicate students present in both class and direct assignments', async () => {
      const mockStudent1 = {
        id: 'student-1',
        registration_number: 'REG001',
        photo_url: 'photo1.jpg',
        user: { first_name: 'John', last_name: 'Doe' },
      };

      const mockFeeWithDuplicates = {
        ...mockFee,
        classes: [
          {
            name: 'Class 1',
            academicSession: { academicYear: '2023/2024' },
            student_assignments: [{ student: mockStudent1 }],
          },
        ],
        direct_assignments: [{ student: mockStudent1 }],
      };

      (
        feesModelAction.getFeeWithStudentAssignments as jest.Mock
      ).mockResolvedValue(mockFeeWithDuplicates);

      const result = await service.getStudentsForFee('fee-123');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'student-1',
          name: 'John Doe',
          class: 'Class 1', // Should prefer class info
        }),
      );
    });

    it('should throw NotFoundException if fee not found', async () => {
      (
        feesModelAction.getFeeWithStudentAssignments as jest.Mock
      ).mockResolvedValue(null);

      await expect(service.getStudentsForFee('fee-123')).rejects.toThrow(
        new NotFoundException(mockSysMsg.fee_not_found),
      );
    });
  });

  // ================= GET ACTIVE FEE COMPONENTS =================
  // ================= GET ACTIVE FEE COMPONENTS =================
  describe('getActiveFeeComponents', () => {
    it('should return active fee components mapped to DTO with pagination', async () => {
      const mockActiveFees = [
        {
          ...mockFee,
          id: 'fee-1',
          component_name: 'Tuition',
          amount: 50000,
          term: {
            name: 'First Term',
            academicSession: { academicYear: '2023/2024' },
          },
        },
        {
          ...mockFee,
          id: 'fee-2',
          component_name: 'Library',
          amount: 5000,
          term: {
            name: 'Second Term',
            academicSession: { name: '2023/2024' },
          },
        },
      ];

      (feesModelAction.getActiveFeeComponents as jest.Mock).mockResolvedValue({
        fees: mockActiveFees,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const result = await service.getActiveFeeComponents({
        page: 1,
        limit: 20,
      });

      expect(feesModelAction.getActiveFeeComponents).toHaveBeenCalledWith(
        1,
        20,
      );
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
      expect(result.data[0]).toEqual({
        id: 'fee-1',
        name: 'Tuition',
        amount: 50000,
        session: '2023/2024',
        term: 'First Term',
        frequency: 'Per Term',
      });
    });

    it('should handle missing term or session info gracefully', async () => {
      const mockActiveFees = [
        {
          ...mockFee,
          id: 'fee-3',
          component_name: 'Misc',
          amount: 1000,
          term: null,
        },
      ];

      (feesModelAction.getActiveFeeComponents as jest.Mock).mockResolvedValue({
        fees: mockActiveFees,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const result = await service.getActiveFeeComponents({
        page: 1,
        limit: 20,
      });

      expect(result.data[0]).toEqual({
        id: 'fee-3',
        name: 'Misc',
        amount: 1000,
        session: '',
        term: '',
        frequency: 'Per Term',
      });
    });
  });
});
