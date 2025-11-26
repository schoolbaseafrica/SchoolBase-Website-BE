import { Test, TestingModule } from '@nestjs/testing';

import { CreateDepartmentDto } from '../dto/create-department.dto';
import { UpdateDepartmentDto } from '../dto/update-department.dto';
import { DepartmentService } from '../services/department.service';

import { DepartmentController } from './department.controller';

describe('DepartmentController', () => {
  let controller: DepartmentController;
  let departmentService: {
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    departmentService = {
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentController],
      providers: [
        {
          provide: DepartmentService,
          useValue: departmentService,
        },
      ],
    }).compile();

    controller = module.get<DepartmentController>(DepartmentController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createDepartmentDto: CreateDepartmentDto = {
      name: 'Science',
    };

    it('should delegate to DepartmentService and return its response', async () => {
      const serviceResponse = {
        message: 'Department created successfully',
        data: { id: 'dept-1', name: 'Science' },
      };
      departmentService.create.mockResolvedValue(serviceResponse);

      await expect(controller.create(createDepartmentDto)).resolves.toEqual(
        serviceResponse,
      );
      expect(departmentService.create).toHaveBeenCalledWith(
        createDepartmentDto,
      );
    });

    it('should propagate errors thrown by DepartmentService', async () => {
      const error = new Error('Creation failed');
      departmentService.create.mockRejectedValue(error);

      await expect(controller.create(createDepartmentDto)).rejects.toThrow(
        error,
      );
      expect(departmentService.create).toHaveBeenCalledWith(
        createDepartmentDto,
      );
    });
  });

  describe('update', () => {
    const departmentId = 'dept-1';
    const updateDto: UpdateDepartmentDto = { name: 'Science & Technology' };

    it('should delegate to DepartmentService and return its response', async () => {
      const serviceResponse = {
        message: 'Department updated successfully',
        data: { id: departmentId, name: 'Science & Technology' },
      };
      departmentService.update.mockResolvedValue(serviceResponse);

      await expect(controller.update(departmentId, updateDto)).resolves.toEqual(
        serviceResponse,
      );
      expect(departmentService.update).toHaveBeenCalledWith(
        departmentId,
        updateDto,
      );
    });

    it('should propagate errors thrown by DepartmentService', async () => {
      const error = new Error('Update failed');
      departmentService.update.mockRejectedValue(error);

      await expect(controller.update(departmentId, updateDto)).rejects.toThrow(
        error,
      );
      expect(departmentService.update).toHaveBeenCalledWith(
        departmentId,
        updateDto,
      );
    });
  });

  describe('remove', () => {
    const departmentId = 'dept-1';

    it('should delegate to DepartmentService and return its response', async () => {
      const serviceResponse = {
        message: 'Department deleted successfully',
        data: undefined,
      };
      departmentService.remove.mockResolvedValue(serviceResponse);

      await expect(controller.remove(departmentId)).resolves.toEqual(
        serviceResponse,
      );
      expect(departmentService.remove).toHaveBeenCalledWith(departmentId);
    });

    it('should propagate errors thrown by DepartmentService', async () => {
      const error = new Error('Deletion failed');
      departmentService.remove.mockRejectedValue(error);

      await expect(controller.remove(departmentId)).rejects.toThrow(error);
      expect(departmentService.remove).toHaveBeenCalledWith(departmentId);
    });
  });
});
