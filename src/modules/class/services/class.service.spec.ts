import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../../constants/system.messages';
import { SessionStatus } from '../../academic-session/entities/academic-session.entity';
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
    findAllWithSessionRaw: jest.fn(),
    list: jest.fn(),
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
      // teacherIds: ['valid-uuid-1', 'valid-uuid-2'], // Uncomment if teacherIds are supported
    };
    const mockCreatedClass = {
      id: 'class-uuid-1',
      name: 'Grade 10',
      arm: 'A',
    } as unknown as Class;

    it('should successfully create a new class and link it to the active session', async () => {
      (classModelAction.find as jest.Mock).mockResolvedValue({ payload: [] });
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

      const result = await service.create(createClassDto);

      expect(classModelAction.find).toHaveBeenCalledWith({
        findOptions: {
          name: createClassDto.name,
          arm: createClassDto.arm,
          academicSession: { id: MOCK_ACTIVE_SESSION },
          is_deleted: false,
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

      expect(result.name).toBe(createClassDto.name);
      expect(result.academicSession.id).toBe(MOCK_ACTIVE_SESSION);
    });

    it('should throw ConflictException if the class already exists in the active session', async () => {
      (classModelAction.find as jest.Mock).mockResolvedValue({
        payload: [mockCreatedClass],
      });

      await expect(service.create(createClassDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if no active academic session is found', async () => {
      (academicSessionModelAction.list as jest.Mock).mockResolvedValue({
        payload: [],
      });

      await expect(service.create(createClassDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if teacherIds contains invalid UUIDs', async () => {
      const invalidDto = {
        ...createClassDto,
        teacherIds: ['not-a-uuid'],
      };
      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateClass', () => {
    const classId = 'class-uuid-1';
    const updateDto = { name: 'JSS2', arm: 'B' };
    const mockAcademicSession = {
      id: 'session-uuid-1',
      name: '2026/2027',
      startDate: new Date(),
      endDate: new Date(),
      status: SessionStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
      is_deleted: false,
      deleted_at: null,
    };

    const existingClass = {
      id: classId,
      name: 'JSS1',
      arm: 'A',
      academicSession: mockAcademicSession,
      teacher_assignment: [],
      streams: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Class;

    beforeEach(() => {
      classModelAction.get.mockResolvedValue(existingClass);
      classModelAction.find.mockResolvedValue({
        payload: [],
        paginationMeta: {},
      });
      classModelAction.update = jest.fn();
    });

    it('should update class and return updated response', async () => {
      const result = await service.updateClass(classId, updateDto);

      expect(classModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: classId },
        relations: { academicSession: true },
      });
      expect(classModelAction.find).toHaveBeenCalledWith({
        findOptions: {
          name: updateDto.name,
          arm: updateDto.arm,
          academicSession: { id: existingClass.academicSession.id },
          is_deleted: false,
        },
        transactionOptions: { useTransaction: false },
      });
      expect(classModelAction.update).toHaveBeenCalledWith({
        identifierOptions: { id: classId },
        updatePayload: { name: updateDto.name, arm: updateDto.arm },
        transactionOptions: { useTransaction: false },
      });
      expect(result).toEqual({
        message: expect.any(String),
        id: classId,
        name: updateDto.name,
        arm: updateDto.arm,
        academicSession: {
          id: existingClass.academicSession.id,
          name: existingClass.academicSession.name,
        },
      });
    });

    it('should throw NotFoundException if class does not exist', async () => {
      classModelAction.get.mockResolvedValue(null);
      await expect(service.updateClass('wrong-id', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if name is empty', async () => {
      await expect(service.updateClass(classId, { name: '' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if class with same name/arm exists', async () => {
      classModelAction.find.mockResolvedValue({
        payload: [
          {
            id: 'other-id',
            name: 'JSS2',
            arm: 'B',
            academicSession: mockAcademicSession,
            teacher_assignment: [],
            streams: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            classSubjects: [],
            is_deleted: false,
            deleted_at: null,
          },
        ],
        paginationMeta: {},
      });
      await expect(service.updateClass(classId, updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getGroupedClasses', () => {
    it('should return grouped classes with status_code 200 and message', async () => {
      // Mock grouped data
      const mockRawClasses = [
        {
          id: 'class-id-1',
          name: 'JSS1',
          arm: 'A',
          academicSession: { id: 'session-id', name: '2027/2028' },
        },
        {
          id: 'class-id-2',
          name: 'JSS1',
          arm: 'B',
          academicSession: { id: 'session-id', name: '2027/2028' },
        },
      ];

      mockClassModelAction.list.mockResolvedValue({
        payload: mockRawClasses,
        paginationMeta: { total: 1, page: 1, limit: 20 },
      });

      const expectedGrouped = [
        {
          name: 'JSS1',
          academicSession: { id: 'session-id', name: '2027/2028' },
          classes: [
            { id: 'class-id-1', arm: 'A' },
            { id: 'class-id-2', arm: 'B' },
          ],
        },
      ];

      const result = await service.getGroupedClasses();
      expect(result.message).toBe(sysMsg.CLASS_FETCHED);
      expect(result.items).toEqual(expectedGrouped);
      expect(result.pagination).toBeDefined();
      expect(mockClassModelAction.list).toHaveBeenCalled();
    });

    it('should return status_code 200 and message for empty grouped classes', async () => {
      mockClassModelAction.list.mockResolvedValue({
        payload: [],
        paginationMeta: { total: 0, page: 1, limit: 20 },
      });

      const result = await service.getGroupedClasses();

      expect(result.items).toEqual([]);
      expect(result.pagination).toBeDefined();
      expect(mockClassModelAction.list).toHaveBeenCalled();
    });
  });

  describe('getClassById', () => {
    const classId = 'class-uuid-1';
    const mockAcademicSession = {
      id: 'session-uuid-1',
      name: '2026/2027',
    };
    const existingClass = {
      id: classId,
      name: 'JSS1',
      arm: 'A',
      academicSession: mockAcademicSession,
    } as unknown as Class;

    it('should return the correct flattened response for getClassById', async () => {
      classModelAction.get.mockResolvedValue(existingClass);
      const result = await service.getClassById(classId);
      expect(result).toEqual({
        message: sysMsg.CLASS_FETCHED,
        id: classId,
        name: 'JSS1',
        arm: 'A',
        academicSession: {
          id: 'session-uuid-1',
          name: '2026/2027',
        },
      });
    });

    it('should throw NotFoundException if class does not exist', async () => {
      classModelAction.get.mockResolvedValue(null);
      await expect(service.getClassById('wrong-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getTotalClasses', () => {
    it('should return the total number of classes filtered by sessionId, name, and arm', async () => {
      // Arrange
      const sessionId = 'session-uuid-1';
      const name = 'JSS1';
      const arm = 'A';
      const mockTotal = 5;

      // Mock the list method to return the expected paginationMeta
      classModelAction.list.mockResolvedValue({
        payload: [],
        paginationMeta: { total: mockTotal },
      });

      // Act
      const result = await service.getTotalClasses(sessionId, name, arm);

      // Assert
      expect(classModelAction.list).toHaveBeenCalledWith({
        filterRecordOptions: {
          academicSession: { id: sessionId },
          name,
          arm,
        },
        paginationPayload: { page: 1, limit: 1 },
      });
      expect(result).toEqual({
        message: sysMsg.TOTAL_CLASSES_FETCHED,
        total: mockTotal,
      });
    });

    it('should return zero if no classes match the filter', async () => {
      // Arrange
      classModelAction.list.mockResolvedValue({
        payload: [],
        paginationMeta: { total: 0 },
      });

      // Act
      const result = await service.getTotalClasses(
        'session-uuid-2',
        'JSS9',
        'B',
      );

      // Assert
      expect(result).toEqual({
        message: sysMsg.TOTAL_CLASSES_FETCHED,
        total: 0,
      });
    });
  });

  describe('deleteClass', () => {
    const classId = 'class-uuid-1';

    beforeEach(() => {
      classModelAction.update = jest.fn();
    });

    it('should successfully soft delete a class from the active session', async () => {
      classModelAction.get.mockResolvedValue({
        id: classId,
        name: 'JSS1',
        arm: 'A',
        academicSession: { id: MOCK_ACTIVE_SESSION },
        is_deleted: false,
      } as unknown as Class);

      const result = await service.deleteClass(classId);

      expect(classModelAction.update).toHaveBeenCalledWith({
        identifierOptions: { id: classId },
        updatePayload: {
          is_deleted: true,
          deleted_at: expect.any(Date),
        },
        transactionOptions: { useTransaction: false },
      });

      expect(result).toEqual({
        status_code: 200,
        message: sysMsg.CLASS_DELETED,
      });
    });

    it('should throw NotFoundException if class does not exist', async () => {
      classModelAction.get.mockResolvedValue(null);

      await expect(service.deleteClass('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when trying to delete a class from a past session', async () => {
      classModelAction.get.mockResolvedValue({
        id: classId,
        name: 'JSS2',
        academicSession: { id: 'past-session-id' },
        is_deleted: false,
      } as unknown as Class);

      await expect(service.deleteClass(classId)).rejects.toThrow(
        BadRequestException,
      );
      expect(classModelAction.update).not.toHaveBeenCalled();
    });
  });
});
