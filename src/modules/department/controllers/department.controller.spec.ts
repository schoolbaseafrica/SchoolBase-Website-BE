import { Test, TestingModule } from '@nestjs/testing';

import { UpdateDepartmentDto } from '../dto/update-department.dto';
import { DepartmentService } from '../services/department.service';

import { DepartmentController } from './department.controller';

describe('DepartmentController', () => {
  let controller: DepartmentController;
  let departmentService: { create: jest.Mock; update: jest.Mock };

  beforeEach(async () => {
    departmentService = {
      create: jest.fn(),
      update: jest.fn(),
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
    it('should delegate to DepartmentService and return its response', async () => {
      const createDto = { name: 'Science' };
      const serviceResponse = {
        message: 'Department created successfully',
        data: { id: 'dept-1', name: 'Science' },
      };
      departmentService.create.mockResolvedValue(serviceResponse);

      await expect(controller.create(createDto)).resolves.toEqual(
        serviceResponse,
      );
      expect(departmentService.create).toHaveBeenCalledWith(createDto);
    });

    it('should propagate errors thrown by DepartmentService', async () => {
      const createDto = { name: 'Science' };
      const error = new Error('Creation failed');
      departmentService.create.mockRejectedValue(error);

      await expect(controller.create(createDto)).rejects.toThrow(error);
      expect(departmentService.create).toHaveBeenCalledWith(createDto);
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
});
