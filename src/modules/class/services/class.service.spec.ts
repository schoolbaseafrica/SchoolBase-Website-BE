import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';
import { Logger } from 'winston';

import { AcademicSessionModelAction } from '../../academic-session/model-actions/academic-session-actions';
import { ClassTeacher } from '../entities/class-teacher.entity';
import { Class } from '../entities/class.entity';
import { ClassTeacherModelAction } from '../model-actions/class-teacher.action';
import { ClassModelAction } from '../model-actions/class.actions';

import { ClassService } from './class.service';

// Mock Data Constants
const MOCK_CLASS_ID = '1';
const MOCK_SESSION_ID = '2023-2024';
const MOCK_ACTIVE_SESSION = '2024-2025';

const mockClass = {
  id: MOCK_CLASS_ID,
  name: 'Grade 10',
  streams: [{ name: 'Science' }],
} as unknown as Class;

const mockTeacherAssignment = {
  id: 10,
  assignment_date: new Date('2023-09-01'),
  session_id: MOCK_SESSION_ID,
  is_active: true,
  teacher: {
    id: 'teacher-uuid-101',
    employment_id: 'EMP-2025-001',
    user: {
      first_name: 'John',
      last_name: 'Doe',
    },
  },
  class: mockClass,
} as unknown as ClassTeacher;

describe('ClassService', () => {
  let service: ClassService;
  let classModelAction: jest.Mocked<ClassModelAction>;
  let classTeacherModelAction: jest.Mocked<ClassTeacherModelAction>;
  let mockLogger: jest.Mocked<Logger>;

  const mockClassModelAction = {
    get: jest.fn(),
  };

  const mockClassTeacherModelAction = {
    list: jest.fn(),
  };

  beforeEach(async () => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(),
      child: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<Logger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassService,
        {
          provide: ClassModelAction,
          useValue: mockClassModelAction,
        },
        {
          provide: ClassTeacherModelAction,
          useValue: mockClassTeacherModelAction,
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
        {
          provide: DataSource,
          useValue: {},
        },
        {
          provide: AcademicSessionModelAction,
          useValue: {
            getActive: jest.fn().mockResolvedValue({ id: MOCK_ACTIVE_SESSION }),
          },
        },
      ],
    }).compile();

    service = module.get<ClassService>(ClassService);
    classModelAction = module.get(ClassModelAction);
    classTeacherModelAction = module.get(ClassTeacherModelAction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTeachersByClass', () => {
    it('should return a list of mapped teachers for a specific session', async () => {
      classModelAction.get.mockResolvedValue(mockClass);
      classTeacherModelAction.list.mockResolvedValue({
        payload: [mockTeacherAssignment],
        paginationMeta: {},
      });

      const result = await service.getTeachersByClass(
        MOCK_CLASS_ID,
        MOCK_SESSION_ID,
      );

      expect(classModelAction.get).toHaveBeenCalledWith({
        identifierOptions: {
          id: MOCK_CLASS_ID,
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        teacher_id: 'teacher-uuid-101',
        name: 'John Doe',
        assignment_date: mockTeacherAssignment.assignment_date,
        streams: 'Science',
      });
    });

    it('should use the active session if no session ID is provided', async () => {
      classModelAction.get.mockResolvedValue(mockClass);
      classTeacherModelAction.list.mockResolvedValue({
        payload: [mockTeacherAssignment],
        paginationMeta: {},
      });

      await service.getTeachersByClass(MOCK_CLASS_ID);

      expect(classTeacherModelAction.list).toHaveBeenCalledWith({
        filterRecordOptions: {
          class: { id: MOCK_CLASS_ID },
          session_id: MOCK_ACTIVE_SESSION,
          is_active: true,
        },
        relations: {
          teacher: { user: true },
          class: { streams: true },
        },
      });
    });

    it('should throw NotFoundException if the class does not exist', async () => {
      classModelAction.get.mockResolvedValue(null);

      await expect(
        service.getTeachersByClass('wrong-uuid', MOCK_SESSION_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return an empty array if class exists but has no teachers', async () => {
      const emptyPayload = {
        payload: [],
        paginationMeta: {},
      };
      classModelAction.get.mockResolvedValue(mockClass);
      classTeacherModelAction.list.mockResolvedValue(emptyPayload);

      const result = await service.getTeachersByClass(
        MOCK_CLASS_ID,
        MOCK_SESSION_ID,
      );

      expect(result).toEqual(emptyPayload.payload);
    });
  });
});
