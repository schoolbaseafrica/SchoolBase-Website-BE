import { Test, TestingModule } from '@nestjs/testing';

import { CreateSubjectDto } from '../dto/create-subject.dto';
import { SubjectService } from '../services/subject.service';

import { SubjectController } from './subject.controller';

describe('SubjectController', () => {
  let controller: SubjectController;
  let subjectService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    subjectService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubjectController],
      providers: [
        {
          provide: SubjectService,
          useValue: subjectService,
        },
      ],
    }).compile();

    controller = module.get<SubjectController>(SubjectController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createSubjectDto: CreateSubjectDto = {
      name: 'Biology',
    };

    it('should delegate to SubjectService and return its response', async () => {
      const serviceResponse = {
        message: 'Subject created successfully',
        data: { id: 'subject-1' },
      };
      subjectService.create.mockResolvedValue(serviceResponse);

      await expect(controller.create(createSubjectDto)).resolves.toEqual(
        serviceResponse,
      );
      expect(subjectService.create).toHaveBeenCalledWith(createSubjectDto);
    });

    it('should propagate errors thrown by SubjectService', async () => {
      const error = new Error('Creation failed');
      subjectService.create.mockRejectedValue(error);

      await expect(controller.create(createSubjectDto)).rejects.toThrow(error);
      expect(subjectService.create).toHaveBeenCalledWith(createSubjectDto);
    });
  });

  describe('findAll', () => {
    it('should delegate to SubjectService and return its response', async () => {
      const serviceResponse = {
        message: 'Subjects retrieved successfully',
        data: [
          { id: 'subject-1', name: 'Chemistry' },
          { id: 'subject-2', name: 'Biology' },
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 20,
          total_pages: 1,
          has_next: false,
          has_previous: false,
        },
      };
      subjectService.findAll.mockResolvedValue(serviceResponse);

      const query = { page: 1, limit: 20 };
      await expect(controller.findAll(query)).resolves.toEqual(serviceResponse);
      expect(subjectService.findAll).toHaveBeenCalledWith(1, 20);
    });

    it('should use default pagination values when query params are not provided', async () => {
      const serviceResponse = {
        message: 'Subjects retrieved successfully',
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          total_pages: 0,
          has_next: false,
          has_previous: false,
        },
      };
      subjectService.findAll.mockResolvedValue(serviceResponse);

      const query = {};
      await expect(controller.findAll(query)).resolves.toEqual(serviceResponse);
      expect(subjectService.findAll).toHaveBeenCalledWith(undefined, undefined);
    });

    it('should propagate errors thrown by SubjectService', async () => {
      const error = new Error('Fetch failed');
      subjectService.findAll.mockRejectedValue(error);

      const query = { page: 1, limit: 20 };
      await expect(controller.findAll(query)).rejects.toThrow(error);
      expect(subjectService.findAll).toHaveBeenCalledWith(1, 20);
    });
  });

  describe('findOne', () => {
    it('should delegate to SubjectService and return its response', async () => {
      const serviceResponse = {
        message: 'Subject retrieved successfully',
        data: {
          id: 'subject-1',
          name: 'Chemistry',
          created_at: new Date('2024-01-03T00:00:00Z'),
          updated_at: new Date('2024-01-04T00:00:00Z'),
        },
      };
      subjectService.findOne.mockResolvedValue(serviceResponse);

      await expect(controller.findOne('subject-1')).resolves.toEqual(
        serviceResponse,
      );
      expect(subjectService.findOne).toHaveBeenCalledWith('subject-1');
    });

    it('should propagate errors thrown by SubjectService', async () => {
      const error = new Error('Subject not found');
      subjectService.findOne.mockRejectedValue(error);

      await expect(controller.findOne('non-existent-id')).rejects.toThrow(
        error,
      );
      expect(subjectService.findOne).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('remove', () => {
    it('should delegate to SubjectService and return its response', async () => {
      const serviceResponse = {
        message: 'Subject deleted successfully',
        data: undefined,
      };
      subjectService.remove.mockResolvedValue(serviceResponse);

      await expect(controller.remove('subject-1')).resolves.toEqual(
        serviceResponse,
      );
      expect(subjectService.remove).toHaveBeenCalledWith('subject-1');
    });

    it('should propagate errors thrown by SubjectService', async () => {
      const error = new Error('Delete failed');
      subjectService.remove.mockRejectedValue(error);

      await expect(controller.remove('subject-1')).rejects.toThrow(error);
      expect(subjectService.remove).toHaveBeenCalledWith('subject-1');
    });
  });
});
