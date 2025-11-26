import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import * as sysMsg from '../../../constants/system.messages';
import { UpdateDepartmentDto } from '../dto/update-department.dto';
import { DepartmentModelAction } from '../model-actions/department.actions';

import { DepartmentService } from './department.service';

describe('DepartmentService', () => {
  let service: DepartmentService;
  let departmentModelActionMock: {
    get: jest.Mock;
    list: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    departmentModelActionMock = {
      get: jest.fn(),
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentService,
        {
          provide: DepartmentModelAction,
          useValue: departmentModelActionMock,
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: {
            child: jest.fn().mockReturnValue({
              log: jest.fn(),
              error: jest.fn(),
              warn: jest.fn(),
              debug: jest.fn(),
              verbose: jest.fn(),
              info: jest.fn(),
            }),
          } as unknown as Logger,
        },
      ],
    }).compile();

    service = module.get<DepartmentService>(DepartmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update', () => {
    const departmentId = 'dept-1';
    const existingDepartment = {
      id: departmentId,
      name: 'Science',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-02T00:00:00Z'),
    };

    it('should update a department successfully when valid data is provided', async () => {
      const updateDto: UpdateDepartmentDto = {
        name: 'Science & Technology',
      };
      const updatedDepartment = {
        ...existingDepartment,
        name: updateDto.name,
        updatedAt: new Date('2024-01-03T00:00:00Z'),
      };

      departmentModelActionMock.get
        .mockResolvedValueOnce(existingDepartment) // First call: check if exists
        .mockResolvedValueOnce(undefined) // Second call: check for name conflict
        .mockResolvedValueOnce(updatedDepartment); // Third call: get after update
      departmentModelActionMock.update.mockResolvedValue(updatedDepartment);

      const result = await service.update(departmentId, updateDto);

      expect(result).toEqual({
        message: sysMsg.DEPARTMENT_UPDATED,
        data: {
          id: updatedDepartment.id,
          name: updatedDepartment.name,
          created_at: updatedDepartment.createdAt,
          updated_at: updatedDepartment.updatedAt,
        },
      });

      expect(departmentModelActionMock.get).toHaveBeenCalledTimes(3);
      expect(departmentModelActionMock.update).toHaveBeenCalledWith({
        identifierOptions: { id: departmentId },
        updatePayload: { name: updateDto.name },
        transactionOptions: {
          useTransaction: false,
        },
      });
    });

    it('should throw NotFoundException if department does not exist', async () => {
      const updateDto: UpdateDepartmentDto = {
        name: 'Science & Technology',
      };

      departmentModelActionMock.get.mockResolvedValue(undefined);

      const updatePromise = service.update(departmentId, updateDto);

      await expect(updatePromise).rejects.toBeInstanceOf(NotFoundException);
      await expect(updatePromise).rejects.toThrow(sysMsg.DEPARTMENT_NOT_FOUND);

      expect(departmentModelActionMock.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if new name conflicts with existing department', async () => {
      const updateDto: UpdateDepartmentDto = {
        name: 'Mathematics',
      };
      const conflictingDepartment = {
        id: 'dept-2',
        name: 'Mathematics',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
      };

      departmentModelActionMock.get
        .mockResolvedValueOnce(existingDepartment) // First call: check if exists
        .mockResolvedValueOnce(conflictingDepartment); // Second call: check for name conflict

      const updatePromise = service.update(departmentId, updateDto);

      await expect(updatePromise).rejects.toBeInstanceOf(ConflictException);
      await expect(updatePromise).rejects.toThrow(
        sysMsg.DEPARTMENT_ALREADY_EXISTS,
      );

      expect(departmentModelActionMock.update).not.toHaveBeenCalled();
    });

    it('should return current department if no fields to update', async () => {
      const updateDto: UpdateDepartmentDto = {};

      departmentModelActionMock.get.mockResolvedValueOnce(existingDepartment);

      const result = await service.update(departmentId, updateDto);

      expect(result).toEqual({
        message: sysMsg.DEPARTMENT_UPDATED,
        data: {
          id: existingDepartment.id,
          name: existingDepartment.name,
          created_at: existingDepartment.createdAt,
          updated_at: existingDepartment.updatedAt,
        },
      });

      expect(departmentModelActionMock.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if update operation fails', async () => {
      const updateDto: UpdateDepartmentDto = {
        name: 'Science & Technology',
      };

      departmentModelActionMock.get
        .mockResolvedValueOnce(existingDepartment) // First call: check if exists
        .mockResolvedValueOnce(undefined); // Second call: check for name conflict
      departmentModelActionMock.update.mockResolvedValue(undefined);

      const updatePromise = service.update(departmentId, updateDto);

      await expect(updatePromise).rejects.toBeInstanceOf(BadRequestException);
      await expect(updatePromise).rejects.toThrow(sysMsg.OPERATION_FAILED);
    });

    it('should allow updating to the same name (no conflict)', async () => {
      const updateDto: UpdateDepartmentDto = {
        name: 'Science', // Same as existing
      };
      const updatedDepartment = {
        ...existingDepartment,
        updatedAt: new Date('2024-01-03T00:00:00Z'),
      };

      departmentModelActionMock.get
        .mockResolvedValueOnce(existingDepartment) // First call: check if exists
        .mockResolvedValueOnce(existingDepartment) // Second call: check for name conflict (same ID, so OK)
        .mockResolvedValueOnce(updatedDepartment); // Third call: get after update
      departmentModelActionMock.update.mockResolvedValue(updatedDepartment);

      const result = await service.update(departmentId, updateDto);

      expect(result.message).toBe(sysMsg.DEPARTMENT_UPDATED);
      expect(departmentModelActionMock.update).toHaveBeenCalled();
    });
  });
});
