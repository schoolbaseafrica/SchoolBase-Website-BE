import { Test, TestingModule } from '@nestjs/testing';

import { CreateSubjectDto } from '../dto/create-subject.dto';
import { SubjectService } from '../services/subject.service';

import { SubjectController } from './subject.controller';

describe('SubjectController', () => {
  let controller: SubjectController;
  let subjectService: { create: jest.Mock };

  beforeEach(async () => {
    subjectService = {
      create: jest.fn(),
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
      departmentIds: ['dep-1'],
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
});
