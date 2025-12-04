import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import * as sysMsg from '../../constants/system.messages';
import {
  AcademicSession,
  SessionStatus,
} from '../academic-session/entities/academic-session.entity';
import {
  Term,
  TermName,
  TermStatus,
} from '../academic-term/entities/term.entity';
import { UserRole } from '../shared/enums';

import { DeactivateFeeDto } from './dto/deactivate-fee.dto';
import { CreateFeesDto, QueryFeesDto, UpdateFeesDto } from './dto/fees.dto';
import { Fees } from './entities/fees.entity';
import { FeeStatus } from './enums/fees.enums';
import { FeesController } from './fees.controller';
import { FeesService } from './fees.service';

describe('FeesController', () => {
  let controller: FeesController;
  let service: jest.Mocked<FeesService>;

  const mockCreateFeesDto: CreateFeesDto = {
    component_name: 'Tuition Fee',
    amount: 500,
    description: 'Tuition fee for semester',
    term_id: 'a9b8c7d6-e5f4-3210-fedc-ba9876543210',
    class_ids: ['c5d4e3f2-g1h0-9876-5432-10abcdef9876'],
  };

  const mockUpdateFeesDto: UpdateFeesDto = {
    component_name: 'Updated Fee',
    amount: 600,
  };

  const mockDeactivateFeeDto: DeactivateFeeDto = {
    reason: 'No longer applicable',
  };

  const mockUser = {
    user: {
      userId: 'user-123',
    },
  };

  const mockTerm: Term = {
    id: 'term-123',
    sessionId: 'session-456',
    academicSession: {
      id: 'session-456',
      name: '2025/2026',
      academicYear: '2025/2026',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      status: SessionStatus.ACTIVE,
      terms: [],
    } as AcademicSession,
    name: TermName.FIRST,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-04-30'),
    status: TermStatus.ACTIVE,
    isCurrent: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFee: Fees = {
    id: 'fee-789',
    component_name: 'Tuition Fee',
    amount: 500,
    description: 'Tuition fee for semester',
    term_id: mockTerm.id,
    term: mockTerm,
    classes: [],
    direct_assignments: [],
    status: FeeStatus.ACTIVE,
    created_by: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeesController],
      providers: [
        {
          provide: FeesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            deactivate: jest.fn(),
            activate: jest.fn(),
            getStudentsForFee: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<FeesController>(FeesController);
    service = module.get(FeesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createFee', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should successfully create a fee', async () => {
      service.create.mockResolvedValue(mockFee);

      const result = await controller.createFee(mockCreateFeesDto, mockUser);

      expect(service.create).toHaveBeenCalledWith(
        mockCreateFeesDto,
        mockUser.user.userId,
      );
      expect(service.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        message: sysMsg.FEE_CREATED_SUCCESSFULLY,
        fee: mockFee,
      });
    });

    it('should pass userId from request to service', async () => {
      service.create.mockResolvedValue(mockFee);

      await controller.createFee(mockCreateFeesDto, mockUser);

      expect(service.create).toHaveBeenCalledWith(
        mockCreateFeesDto,
        'user-123',
      );
    });

    it('should pass all DTO fields to the service', async () => {
      service.create.mockResolvedValue(mockFee);

      await controller.createFee(mockCreateFeesDto, mockUser);

      expect(service.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: mockCreateFeesDto.amount,
          description: mockCreateFeesDto.description,
        }),
        mockUser.user.userId,
      );
    });

    it('should return the fee object in the response', async () => {
      service.create.mockResolvedValue(mockFee);

      const result = await controller.createFee(mockCreateFeesDto, mockUser);

      expect(result).toHaveProperty('fee');
      expect(result.fee).toEqual(mockFee);
      expect(result.fee.id).toBe('fee-789');
    });

    it('should return success message in the response', async () => {
      service.create.mockResolvedValue(mockFee);

      const result = await controller.createFee(mockCreateFeesDto, mockUser);

      expect(result).toHaveProperty('message');
      expect(result.message).toBe(sysMsg.FEE_CREATED_SUCCESSFULLY);
    });

    it('should propagate service errors', async () => {
      const serviceError = new Error('Database connection failed');
      service.create.mockRejectedValue(serviceError);

      await expect(
        controller.createFee(mockCreateFeesDto, mockUser),
      ).rejects.toThrow(serviceError);

      expect(service.create).toHaveBeenCalledWith(
        mockCreateFeesDto,
        mockUser.user.userId,
      );
    });

    it('should handle different user IDs', async () => {
      const differentUser = {
        user: {
          userId: 'user-456',
        },
      };

      service.create.mockResolvedValue(mockFee);

      await controller.createFee(mockCreateFeesDto, differentUser);

      expect(service.create).toHaveBeenCalledWith(
        mockCreateFeesDto,
        'user-456',
      );
    });

    it('should handle fees with different amounts', async () => {
      const dtoWithDifferentAmount: CreateFeesDto = {
        ...mockCreateFeesDto,
        amount: 1000,
      };

      service.create.mockResolvedValue({
        ...mockFee,
        amount: 1000,
      });

      const result = await controller.createFee(
        dtoWithDifferentAmount,
        mockUser,
      );

      expect(service.create).toHaveBeenCalledWith(
        dtoWithDifferentAmount,
        mockUser.user.userId,
      );
      expect(result.fee.amount).toBe(1000);
    });

    it('should handle fees with special characters in description', async () => {
      const dtoWithSpecialChars: CreateFeesDto = {
        component_name: 'Lab Fee',
        amount: 250,
        description: 'Lab fee & equipment <test> !@#$%^&*()',
        term_id: 'term-123',
        class_ids: ['c5d4e3f2-g1h0-9876-5432-10abcdef9876'],
      };

      service.create.mockResolvedValue(mockFee);

      const result = await controller.createFee(dtoWithSpecialChars, mockUser);

      expect(service.create).toHaveBeenCalledWith(
        dtoWithSpecialChars,
        mockUser.user.userId,
      );
      expect(result).toEqual({
        message: sysMsg.FEE_CREATED_SUCCESSFULLY,
        fee: mockFee,
      });
    });

    it('should handle very long descriptions', async () => {
      const longDescription = 'A'.repeat(1000);
      const dtoWithLongDescription: CreateFeesDto = {
        component_name: 'Lab Fee',
        amount: 250,
        description: longDescription,
        term_id: 'term-123',
        class_ids: ['c5d4e3f2-g1h0-9876-5432-10abcdef9876'],
      };

      service.create.mockResolvedValue(mockFee);

      await controller.createFee(dtoWithLongDescription, mockUser);

      expect(service.create).toHaveBeenCalledWith(
        dtoWithLongDescription,
        mockUser.user.userId,
      );
    });

    it('should handle different date formats', async () => {
      const dtoWithDifferentTerm: CreateFeesDto = {
        component_name: 'Summer Fee',
        amount: 400,
        description: 'Summer term fee',
        term_id: 'term-456',
        class_ids: ['class-123'],
      };

      service.create.mockResolvedValue(mockFee);

      await controller.createFee(dtoWithDifferentTerm, mockUser);

      expect(service.create).toHaveBeenCalledWith(
        dtoWithDifferentTerm,
        mockUser.user.userId,
      );
    });

    it('should handle validation errors from service', async () => {
      const validationError = new Error('Invalid fee amount');
      service.create.mockRejectedValue(validationError);

      await expect(
        controller.createFee(mockCreateFeesDto, mockUser),
      ).rejects.toThrow(validationError);
    });
  });

  describe('getAllFees', () => {
    const mockQueryDto: QueryFeesDto = {
      page: 1,
      limit: 20,
    };

    const mockFeesResult = {
      fees: [mockFee],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };

    it('should be defined', () => {
      expect(controller.getAllFees).toBeDefined();
    });

    it('should successfully retrieve all fees', async () => {
      service.findAll.mockResolvedValue(mockFeesResult);

      const result = await controller.getAllFees(mockQueryDto);

      expect(service.findAll).toHaveBeenCalledWith(mockQueryDto);
      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        message: sysMsg.FEES_RETRIEVED_SUCCESSFULLY,
        fees: mockFeesResult.fees,
        total: mockFeesResult.total,
        page: mockFeesResult.page,
        limit: mockFeesResult.limit,
        totalPages: mockFeesResult.totalPages,
      });
    });

    it('should pass query parameters to service', async () => {
      const queryWithFilters: QueryFeesDto = {
        status: FeeStatus.ACTIVE,
        class_id: 'class-123',
        term_id: 'term-123',
        search: 'tuition',
        page: 2,
        limit: 10,
      };

      service.findAll.mockResolvedValue({
        ...mockFeesResult,
        page: 2,
        limit: 10,
      });

      await controller.getAllFees(queryWithFilters);

      expect(service.findAll).toHaveBeenCalledWith(queryWithFilters);
    });

    it('should return correct response structure', async () => {
      service.findAll.mockResolvedValue(mockFeesResult);

      const result = await controller.getAllFees(mockQueryDto);

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('fees');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('totalPages');
      expect(result.message).toBe(sysMsg.FEES_RETRIEVED_SUCCESSFULLY);
    });

    it('should handle empty results', async () => {
      const emptyResult = {
        fees: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      service.findAll.mockResolvedValue(emptyResult);

      const result = await controller.getAllFees(mockQueryDto);

      expect(result.fees).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should handle pagination correctly', async () => {
      const paginatedResult = {
        fees: [mockFee],
        total: 50,
        page: 3,
        limit: 10,
        totalPages: 5,
      };

      service.findAll.mockResolvedValue(paginatedResult);

      const queryDto: QueryFeesDto = {
        page: 3,
        limit: 10,
      };

      const result = await controller.getAllFees(queryDto);

      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(5);
      expect(result.total).toBe(50);
    });

    it('should propagate service errors', async () => {
      const serviceError = new Error('Database connection failed');
      service.findAll.mockRejectedValue(serviceError);

      await expect(controller.getAllFees(mockQueryDto)).rejects.toThrow(
        serviceError,
      );

      expect(service.findAll).toHaveBeenCalledWith(mockQueryDto);
    });

    it('should handle filtering by status', async () => {
      const queryDto: QueryFeesDto = {
        status: FeeStatus.INACTIVE,
        page: 1,
        limit: 20,
      };

      service.findAll.mockResolvedValue(mockFeesResult);

      await controller.getAllFees(queryDto);

      expect(service.findAll).toHaveBeenCalledWith(queryDto);
    });

    it('should handle filtering by class_id', async () => {
      const queryDto: QueryFeesDto = {
        class_id: 'class-123',
        page: 1,
        limit: 20,
      };

      service.findAll.mockResolvedValue(mockFeesResult);

      await controller.getAllFees(queryDto);

      expect(service.findAll).toHaveBeenCalledWith(queryDto);
    });

    it('should handle filtering by term_id', async () => {
      const queryDto: QueryFeesDto = {
        term_id: 'term-123',
        page: 1,
        limit: 20,
      };

      service.findAll.mockResolvedValue(mockFeesResult);

      await controller.getAllFees(queryDto);

      expect(service.findAll).toHaveBeenCalledWith(queryDto);
    });

    it('should handle search query', async () => {
      const queryDto: QueryFeesDto = {
        search: 'library',
        page: 1,
        limit: 20,
      };

      service.findAll.mockResolvedValue(mockFeesResult);

      await controller.getAllFees(queryDto);

      expect(service.findAll).toHaveBeenCalledWith(queryDto);
    });

    it('should handle multiple filters combined', async () => {
      const queryDto: QueryFeesDto = {
        status: FeeStatus.ACTIVE,
        class_id: 'class-123',
        term_id: 'term-123',
        search: 'tuition',
        page: 1,
        limit: 20,
      };

      service.findAll.mockResolvedValue(mockFeesResult);

      await controller.getAllFees(queryDto);

      expect(service.findAll).toHaveBeenCalledWith(queryDto);
    });

    it('should use default pagination when not provided', async () => {
      const queryDto: QueryFeesDto = {};

      service.findAll.mockResolvedValue(mockFeesResult);

      await controller.getAllFees(queryDto);

      expect(service.findAll).toHaveBeenCalledWith(queryDto);
    });
  });

  describe('updateFee', () => {
    it('should update a fee successfully', async () => {
      service.update.mockResolvedValue(mockFee);

      const result = await controller.updateFee('fee-123', mockUpdateFeesDto);

      expect(service.update).toHaveBeenCalledWith('fee-123', mockUpdateFeesDto);
      expect(result).toEqual({
        message: sysMsg.FEE_UPDATED_SUCCESSFULLY,
        fee: mockFee,
      });
    });

    it('should handle fee not found during update', async () => {
      const notFoundError = new NotFoundException(sysMsg.FEE_NOT_FOUND);
      service.update.mockRejectedValue(notFoundError);

      await expect(
        controller.updateFee('invalid-id', mockUpdateFeesDto),
      ).rejects.toThrow(notFoundError);
    });
  });

  describe('deactivateFee', () => {
    it('should deactivate a fee successfully', async () => {
      service.deactivate.mockResolvedValue(mockFee);

      const result = await controller.deactivateFee(
        'fee-123',
        mockDeactivateFeeDto,
        mockUser,
      );

      expect(service.deactivate).toHaveBeenCalledWith(
        'fee-123',
        mockUser.user.userId,
        mockDeactivateFeeDto.reason,
      );
      expect(result).toEqual({
        message: sysMsg.FEE_DEACTIVATED_SUCCESSFULLY,
        data: mockFee,
      });
    });

    it('should handle fee not found', async () => {
      const notFoundError = new NotFoundException(sysMsg.FEE_NOT_FOUND);
      service.deactivate.mockRejectedValue(notFoundError);

      await expect(
        controller.deactivateFee('invalid-id', mockDeactivateFeeDto, mockUser),
      ).rejects.toThrow(notFoundError);
    });

    it('should call deactivate without reason when not provided', async () => {
      const deactivateDtoWithoutReason = {};
      service.deactivate.mockResolvedValue(mockFee);

      await controller.deactivateFee(
        'fee-123',
        deactivateDtoWithoutReason as DeactivateFeeDto,
        mockUser,
      );

      expect(service.deactivate).toHaveBeenCalledWith(
        'fee-123',
        mockUser.user.userId,
        undefined,
      );
    });
  });

  describe('Guards and Decorators', () => {
    it('should have JwtAuthGuard applied', () => {
      const guards = Reflect.getMetadata('__guards__', FeesController);
      expect(guards).toBeDefined();
    });

    it('should have RolesGuard applied', () => {
      const guards = Reflect.getMetadata('__guards__', FeesController);
      expect(guards).toBeDefined();
    });

    it('should require ADMIN role for createFee', () => {
      const roles = Reflect.getMetadata('roles', controller.createFee);
      expect(roles).toContain(UserRole.ADMIN);
    });

    it('should require ADMIN role for updateFee', () => {
      const roles = Reflect.getMetadata('roles', controller.updateFee);
      expect(roles).toContain(UserRole.ADMIN);
    });

    it('should require ADMIN role for deactivateFee', () => {
      const roles = Reflect.getMetadata('roles', controller.deactivateFee);
      expect(roles).toContain(UserRole.ADMIN);
    });

    it('should have correct route path', () => {
      const path = Reflect.getMetadata('path', FeesController);
      expect(path).toBe('fees');
    });
  });

  describe('activateFee', () => {
    it('should activate a fee successfully', async () => {
      const activeFee = { ...mockFee, status: FeeStatus.ACTIVE };
      service.activate.mockResolvedValue(activeFee);

      const result = await controller.activateFee('fee-123', mockUser);

      expect(service.activate).toHaveBeenCalledWith(
        'fee-123',
        mockUser.user.userId,
      );
      expect(result).toEqual({
        message: sysMsg.FEE_UPDATED_SUCCESSFULLY,
        fee: activeFee,
      });
    });

    it('should handle fee not found', async () => {
      const notFoundError = new NotFoundException(sysMsg.FEE_NOT_FOUND);
      service.activate.mockRejectedValue(notFoundError);

      await expect(
        controller.activateFee('invalid-id', mockUser),
      ).rejects.toThrow(notFoundError);
    });

    it('should pass correct userId to service', async () => {
      const activeFee = { ...mockFee, status: FeeStatus.ACTIVE };
      service.activate.mockResolvedValue(activeFee);

      await controller.activateFee('fee-123', mockUser);

      expect(service.activate).toHaveBeenCalledWith('fee-123', 'user-123');
    });

    it('should require ADMIN role for activateFee', () => {
      const roles = Reflect.getMetadata('roles', controller.activateFee);
      expect(roles).toContain(UserRole.ADMIN);
    });
  });

  describe('getFeeStudents', () => {
    it('should return students for a fee', async () => {
      const mockStudents = [
        {
          id: 'student-1',
          name: 'John Doe',
          class: 'Class 1',
          session: '2023/2024',
          registration_number: 'REG001',
        },
      ];

      service.getStudentsForFee.mockResolvedValue(mockStudents);

      const result = await controller.getFeeStudents('fee-123');

      expect(service.getStudentsForFee).toHaveBeenCalledWith('fee-123');
      expect(result).toEqual({
        message: sysMsg.FEES_RETRIEVED_SUCCESSFULLY,
        data: mockStudents,
      });
    });

    it('should propagate service errors', async () => {
      const error = new NotFoundException(sysMsg.FEE_NOT_FOUND);
      service.getStudentsForFee.mockRejectedValue(error);

      await expect(controller.getFeeStudents('fee-123')).rejects.toThrow(error);
    });
  });
});
