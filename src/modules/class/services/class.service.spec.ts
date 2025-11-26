import {
  ConflictException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../../constants/system.messages';
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

const mockRepository = {};

const mockDataSource = {
  createEntityManager: jest.fn(),
  getRepository: jest.fn().mockReturnValue(mockRepository),
  transaction: jest.fn().mockImplementation(async (callback) => {
    return callback({});
  }),
};

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
  let academicSessionModelAction: jest.Mocked<AcademicSessionModelAction>;
  let mockLogger: jest.Mocked<Logger>;

  const mockClassModelAction = {
    get: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    findAllWithSession: jest.fn(),
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
          useValue: mockDataSource,
        },
        {
          provide: AcademicSessionModelAction,
          useValue: {
            list: jest.fn().mockResolvedValue({
              payload: [
                { id: MOCK_ACTIVE_SESSION, name: '2024/2025 Academic Session' },
              ],
              paginationMeta: {},
            }),
            find: jest.fn().mockResolvedValue({ payload: [] }),
          },
        },
      ],
    }).compile();

    service = module.get<ClassService>(ClassService);
    classModelAction = module.get(ClassModelAction);
    classTeacherModelAction = module.get(ClassTeacherModelAction);
    academicSessionModelAction = module.get(AcademicSessionModelAction);
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
  describe('create', () => {
    const createClassDto = {
      name: 'Grade 10',
      arm: 'A',
    };
    const mockCreatedClass = {
      id: 'class-uuid-1',
      name: 'Grade 10',
      arm: 'A',
    } as unknown as Class;

    it('should successfully create a new class and link it to the active session', async () => {
      // Setup
      (classModelAction.find as jest.Mock).mockResolvedValue({
        payload: [],
      }); // Class does not exist
      (classModelAction.create as jest.Mock).mockResolvedValue(
        mockCreatedClass,
      );
      const activeSession = {
        id: MOCK_ACTIVE_SESSION,
        name: '2024/2025 Academic Session',
      };
      (academicSessionModelAction.list as jest.Mock).mockResolvedValue({
        payload: [activeSession],
        paginationMeta: {},
      });

      // Execute
      const result = await service.create(createClassDto);

      // Assertions
      expect(classModelAction.find).toHaveBeenCalledWith({
        findOptions: {
          name: createClassDto.name,
          arm: createClassDto.arm,
          academicSession: { id: MOCK_ACTIVE_SESSION },
        },
        transactionOptions: {
          useTransaction: false,
        },
      });

      expect(classModelAction.create).toHaveBeenCalledWith({
        createPayload: {
          name: createClassDto.name,
          arm: createClassDto.arm,
          academicSession: activeSession,
        },
        transactionOptions: {
          useTransaction: true,
          transaction: expect.any(Object),
        },
      });

      expect(result.status_code).toBe(HttpStatus.CREATED);
      expect(result.data.name).toBe(createClassDto.name);
      expect(result.data.academicSession.id).toBe(MOCK_ACTIVE_SESSION);
    });

    it('should throw ConflictException if the class already exists in the active session', async () => {
      // Setup
      (classModelAction.find as jest.Mock).mockResolvedValue({
        payload: [mockCreatedClass],
      }); // Class already exists

      // Execute & Assert
      await expect(service.create(createClassDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if no active academic session is found', async () => {
      // Setup
      (academicSessionModelAction.list as jest.Mock).mockResolvedValue({
        payload: [],
      }); // No active session

      // Execute & Assert
      await expect(service.create(createClassDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getGroupedClasses', () => {
    it('should return grouped classes with status_code 200 and message', async () => {
      // Mock grouped data
      const mockGrouped = [
        {
          name: 'JSS1',
          academicSession: { id: 'session-id', name: '2027/2028' },
          classes: [
            { id: 'class-id-1', arm: 'A' },
            { id: 'class-id-2', arm: 'B' },
          ],
        },
      ];
      (mockClassModelAction.findAllWithSession as jest.Mock).mockResolvedValue(
        mockGrouped,
      );

      const result = await service.getGroupedClasses();

      expect(result.status_code).toBe(200);
      expect(result.message).toBe(sysMsg.CLASS_FETCHED);
      expect(result.data).toEqual(mockGrouped);
      expect(mockClassModelAction.findAllWithSession).toHaveBeenCalled();
    });

    it('should return status_code 200 and message for empty grouped classes', async () => {
      (mockClassModelAction.findAllWithSession as jest.Mock).mockResolvedValue(
        [],
      );

      const result = await service.getGroupedClasses();

      expect(result.status_code).toBe(200);
      expect(result.message).toBe(sysMsg.NO_CLASS_FOUND);
      expect(result.data).toEqual([]);
      expect(mockClassModelAction.findAllWithSession).toHaveBeenCalled();
    });
  });
});
