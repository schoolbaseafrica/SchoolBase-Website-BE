import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { EntityManager } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../../constants/system.messages';
import { Student } from '../../student/entities/student.entity';
import { StudentModelAction } from '../../student/model-actions/student-actions';
import { ClassStudent } from '../entities/class-student.entity';
import { Class } from '../entities/class.entity';
import { ClassStudentModelAction } from '../model-actions/class-student.action';
import { ClassModelAction } from '../model-actions/class.actions';

import { ClassStudentValidationService } from './class-student-validation.service';

// Mock Data Constants
const MOCK_CLASS_ID = 'class-uuid-1';
const MOCK_STUDENT_ID = 'student-uuid-1';
const MOCK_OTHER_STUDENT_ID = 'student-uuid-2';
const MOCK_SESSION_ID = 'session-uuid-1';
const MOCK_OTHER_CLASS_ID = 'class-uuid-2';

const mockClass = {
  id: MOCK_CLASS_ID,
  name: 'JSS1',
  arm: 'A',
  is_deleted: false,
  academicSession: {
    id: MOCK_SESSION_ID,
    name: '2024/2025 Academic Session',
  },
} as unknown as Class;

const mockDeletedClass = {
  id: MOCK_CLASS_ID,
  name: 'JSS1',
  arm: 'A',
  is_deleted: true,
  academicSession: {
    id: MOCK_SESSION_ID,
    name: '2024/2025 Academic Session',
  },
} as unknown as Class;

const mockStudent = {
  id: MOCK_STUDENT_ID,
  registration_number: 'STU-2025-001',
  is_deleted: false,
} as unknown as Student;

const mockDeletedStudent = {
  id: MOCK_STUDENT_ID,
  registration_number: 'STU-2025-001',
  is_deleted: true,
} as unknown as Student;

const mockOtherClass = {
  id: MOCK_OTHER_CLASS_ID,
  name: 'JSS2',
  arm: 'B',
} as unknown as Class;

const mockExistingAssignment = {
  id: 'assignment-uuid-1',
  student: { id: MOCK_STUDENT_ID },
  class: mockOtherClass,
  session_id: MOCK_SESSION_ID,
  is_active: true,
} as unknown as ClassStudent;

describe('ClassStudentValidationService', () => {
  let service: ClassStudentValidationService;
  let classModelAction: jest.Mocked<ClassModelAction>;
  let studentModelAction: jest.Mocked<StudentModelAction>;
  let classStudentModelAction: jest.Mocked<ClassStudentModelAction>;
  let mockLogger: jest.Mocked<Logger>;
  let mockManager: jest.Mocked<EntityManager>;

  const mockClassModelAction = {
    get: jest.fn(),
  };

  const mockStudentModelAction = {
    get: jest.fn(),
  };

  const mockClassStudentModelAction = {
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

    mockManager = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassStudentValidationService,
        {
          provide: ClassModelAction,
          useValue: mockClassModelAction,
        },
        {
          provide: StudentModelAction,
          useValue: mockStudentModelAction,
        },
        {
          provide: ClassStudentModelAction,
          useValue: mockClassStudentModelAction,
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<ClassStudentValidationService>(
      ClassStudentValidationService,
    );
    classModelAction = module.get(ClassModelAction);
    studentModelAction = module.get(StudentModelAction);
    classStudentModelAction = module.get(ClassStudentModelAction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateClassExists', () => {
    it('should return class entity if class exists and is not deleted', async () => {
      classModelAction.get.mockResolvedValue(mockClass);

      const result = await service.validateClassExists(MOCK_CLASS_ID);

      expect(result).toEqual(mockClass);
      expect(classModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: MOCK_CLASS_ID },
        relations: { academicSession: true },
      });
    });

    it('should throw NotFoundException if class does not exist', async () => {
      classModelAction.get.mockResolvedValue(null);

      await expect(service.validateClassExists(MOCK_CLASS_ID)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.validateClassExists(MOCK_CLASS_ID)).rejects.toThrow(
        sysMsg.CLASS_NOT_FOUND,
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Class not found or deleted',
        { classId: MOCK_CLASS_ID },
      );
    });

    it('should throw NotFoundException if class is soft-deleted', async () => {
      classModelAction.get.mockResolvedValue(mockDeletedClass);

      await expect(service.validateClassExists(MOCK_CLASS_ID)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.validateClassExists(MOCK_CLASS_ID)).rejects.toThrow(
        sysMsg.CLASS_NOT_FOUND,
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Class not found or deleted',
        { classId: MOCK_CLASS_ID },
      );
    });
  });

  describe('validateStudentExists', () => {
    it('should pass if student exists and is not deleted', async () => {
      studentModelAction.get.mockResolvedValue(mockStudent);

      await service.validateStudentExists(MOCK_STUDENT_ID);

      expect(studentModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: MOCK_STUDENT_ID },
      });
    });

    it('should throw NotFoundException if student does not exist', async () => {
      studentModelAction.get.mockResolvedValue(null);

      await expect(
        service.validateStudentExists(MOCK_STUDENT_ID),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.validateStudentExists(MOCK_STUDENT_ID),
      ).rejects.toThrow(`Student with ID ${MOCK_STUDENT_ID} not found.`);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Student not found or deleted',
        { studentId: MOCK_STUDENT_ID },
      );
    });

    it('should throw NotFoundException if student is soft-deleted', async () => {
      studentModelAction.get.mockResolvedValue(mockDeletedStudent);

      await expect(
        service.validateStudentExists(MOCK_STUDENT_ID),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.validateStudentExists(MOCK_STUDENT_ID),
      ).rejects.toThrow(`Student with ID ${MOCK_STUDENT_ID} not found.`);
    });
  });

  describe('validateStudentNotInAnotherClass', () => {
    it('should pass if student is not assigned to any class', async () => {
      classStudentModelAction.list.mockResolvedValue({
        payload: [],
        paginationMeta: {},
      });

      await service.validateStudentNotInAnotherClass(
        MOCK_STUDENT_ID,
        MOCK_CLASS_ID,
        MOCK_SESSION_ID,
      );

      expect(classStudentModelAction.list).toHaveBeenCalledWith({
        filterRecordOptions: {
          student: { id: MOCK_STUDENT_ID },
          session_id: MOCK_SESSION_ID,
          is_active: true,
        },
        relations: { class: true },
      });
    });

    it('should pass if student is assigned to the same class', async () => {
      const sameClassAssignment = {
        ...mockExistingAssignment,
        class: mockClass,
      };

      classStudentModelAction.list.mockResolvedValue({
        payload: [sameClassAssignment],
        paginationMeta: {},
      });

      await service.validateStudentNotInAnotherClass(
        MOCK_STUDENT_ID,
        MOCK_CLASS_ID,
        MOCK_SESSION_ID,
      );
    });

    it('should throw ConflictException if student is assigned to a different class', async () => {
      classStudentModelAction.list.mockResolvedValue({
        payload: [mockExistingAssignment],
        paginationMeta: {},
      });

      await expect(
        service.validateStudentNotInAnotherClass(
          MOCK_STUDENT_ID,
          MOCK_CLASS_ID,
          MOCK_SESSION_ID,
        ),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.validateStudentNotInAnotherClass(
          MOCK_STUDENT_ID,
          MOCK_CLASS_ID,
          MOCK_SESSION_ID,
        ),
      ).rejects.toThrow(
        `Cannot assign student: Student with ID ${MOCK_STUDENT_ID} is already assigned to class JSS2 (B) in this academic session.`,
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Student already in another class',
        expect.objectContaining({
          studentId: MOCK_STUDENT_ID,
          targetClassId: MOCK_CLASS_ID,
        }),
      );
    });

    it('should work with transaction manager', async () => {
      mockManager.findOne.mockResolvedValue(null);

      await service.validateStudentNotInAnotherClass(
        MOCK_STUDENT_ID,
        MOCK_CLASS_ID,
        MOCK_SESSION_ID,
        mockManager,
      );

      expect(mockManager.findOne).toHaveBeenCalledWith(ClassStudent, {
        where: {
          student: { id: MOCK_STUDENT_ID },
          session_id: MOCK_SESSION_ID,
          is_active: true,
        },
        relations: ['class'],
      });
    });

    it('should throw ConflictException with transaction manager if student in another class', async () => {
      mockManager.findOne.mockResolvedValue(mockExistingAssignment);

      await expect(
        service.validateStudentNotInAnotherClass(
          MOCK_STUDENT_ID,
          MOCK_CLASS_ID,
          MOCK_SESSION_ID,
          mockManager,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should handle class without arm in error message', async () => {
      const classWithoutArm = {
        ...mockOtherClass,
        arm: null,
      };
      const assignmentWithoutArm = {
        ...mockExistingAssignment,
        class: classWithoutArm,
      };

      classStudentModelAction.list.mockResolvedValue({
        payload: [assignmentWithoutArm],
        paginationMeta: {},
      });

      await expect(
        service.validateStudentNotInAnotherClass(
          MOCK_STUDENT_ID,
          MOCK_CLASS_ID,
          MOCK_SESSION_ID,
        ),
      ).rejects.toThrow(
        `Cannot assign student: Student with ID ${MOCK_STUDENT_ID} is already assigned to class JSS2 in this academic session.`,
      );
    });
  });

  describe('validateStudentAssignment', () => {
    it('should pass all validations for valid assignment', async () => {
      classModelAction.get.mockResolvedValue(mockClass);
      studentModelAction.get.mockResolvedValue(mockStudent);
      classStudentModelAction.list.mockResolvedValue({
        payload: [],
        paginationMeta: {},
      });

      await service.validateStudentAssignment(
        MOCK_CLASS_ID,
        MOCK_STUDENT_ID,
        MOCK_SESSION_ID,
      );

      expect(classModelAction.get).toHaveBeenCalled();
      expect(studentModelAction.get).toHaveBeenCalled();
      expect(classStudentModelAction.list).toHaveBeenCalled();
    });

    it('should throw if class does not exist', async () => {
      classModelAction.get.mockResolvedValue(null);

      await expect(
        service.validateStudentAssignment(
          MOCK_CLASS_ID,
          MOCK_STUDENT_ID,
          MOCK_SESSION_ID,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if student does not exist', async () => {
      classModelAction.get.mockResolvedValue(mockClass);
      studentModelAction.get.mockResolvedValue(null);

      await expect(
        service.validateStudentAssignment(
          MOCK_CLASS_ID,
          MOCK_STUDENT_ID,
          MOCK_SESSION_ID,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if student is in another class', async () => {
      classModelAction.get.mockResolvedValue(mockClass);
      studentModelAction.get.mockResolvedValue(mockStudent);
      classStudentModelAction.list.mockResolvedValue({
        payload: [mockExistingAssignment],
        paginationMeta: {},
      });

      await expect(
        service.validateStudentAssignment(
          MOCK_CLASS_ID,
          MOCK_STUDENT_ID,
          MOCK_SESSION_ID,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should work with transaction manager', async () => {
      classModelAction.get.mockResolvedValue(mockClass);
      studentModelAction.get.mockResolvedValue(mockStudent);
      mockManager.findOne.mockResolvedValue(null);

      await service.validateStudentAssignment(
        MOCK_CLASS_ID,
        MOCK_STUDENT_ID,
        MOCK_SESSION_ID,
        mockManager,
      );

      expect(mockManager.findOne).toHaveBeenCalled();
      expect(classModelAction.get).toHaveBeenCalled();
      expect(studentModelAction.get).toHaveBeenCalled();
    });
  });

  describe('validateBatchStudentAssignment', () => {
    it('should pass all validations for valid batch assignment', async () => {
      classModelAction.get.mockResolvedValue(mockClass);
      studentModelAction.get.mockResolvedValue(mockStudent);
      classStudentModelAction.list.mockResolvedValue({
        payload: [],
        paginationMeta: {},
      });

      await service.validateBatchStudentAssignment(
        MOCK_CLASS_ID,
        [MOCK_STUDENT_ID, MOCK_OTHER_STUDENT_ID],
        MOCK_SESSION_ID,
      );

      expect(classModelAction.get).toHaveBeenCalled();
      expect(studentModelAction.get).toHaveBeenCalledTimes(2);
    });

    it('should remove duplicate student IDs', async () => {
      classModelAction.get.mockResolvedValue(mockClass);
      studentModelAction.get.mockResolvedValue(mockStudent);
      classStudentModelAction.list.mockResolvedValue({
        payload: [],
        paginationMeta: {},
      });

      await service.validateBatchStudentAssignment(
        MOCK_CLASS_ID,
        [MOCK_STUDENT_ID, MOCK_STUDENT_ID, MOCK_OTHER_STUDENT_ID],
        MOCK_SESSION_ID,
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Duplicate student IDs detected'),
        expect.any(Object),
      );
      // Should only validate unique students
      expect(studentModelAction.get).toHaveBeenCalledTimes(2);
    });

    it('should throw NotFoundException with batch prefix if student not found', async () => {
      classModelAction.get.mockResolvedValue(mockClass);
      studentModelAction.get
        .mockResolvedValueOnce(mockStudent)
        .mockResolvedValueOnce(null);

      await expect(
        service.validateBatchStudentAssignment(
          MOCK_CLASS_ID,
          [MOCK_STUDENT_ID, MOCK_OTHER_STUDENT_ID],
          MOCK_SESSION_ID,
        ),
      ).rejects.toThrow(NotFoundException);

      // Reset mocks for second call
      classModelAction.get.mockResolvedValue(mockClass);
      studentModelAction.get
        .mockResolvedValueOnce(mockStudent)
        .mockResolvedValueOnce(null);

      // Verify the error message
      await expect(
        service.validateBatchStudentAssignment(
          MOCK_CLASS_ID,
          [MOCK_STUDENT_ID, MOCK_OTHER_STUDENT_ID],
          MOCK_SESSION_ID,
        ),
      ).rejects.toThrow(
        `Cannot assign students: Student with ID ${MOCK_OTHER_STUDENT_ID} not found.`,
      );
    });

    it('should throw ConflictException with batch prefix if student in another class', async () => {
      classModelAction.get.mockResolvedValue(mockClass);
      studentModelAction.get.mockResolvedValue(mockStudent);
      classStudentModelAction.list.mockResolvedValue({
        payload: [mockExistingAssignment],
        paginationMeta: {},
      });

      await expect(
        service.validateBatchStudentAssignment(
          MOCK_CLASS_ID,
          [MOCK_STUDENT_ID],
          MOCK_SESSION_ID,
        ),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.validateBatchStudentAssignment(
          MOCK_CLASS_ID,
          [MOCK_STUDENT_ID],
          MOCK_SESSION_ID,
        ),
      ).rejects.toThrow(
        `Cannot assign students: Student with ID ${MOCK_STUDENT_ID} is already assigned to class JSS2 (B) in this academic session.`,
      );
    });

    it('should not duplicate prefix if error already has batch prefix', async () => {
      classModelAction.get.mockResolvedValue(mockClass);
      studentModelAction.get.mockResolvedValue(mockStudent);

      // Mock an error that already has batch prefix
      const errorWithPrefix = new ConflictException(
        'Cannot assign students: Some error message',
      );

      classStudentModelAction.list.mockImplementation(() => {
        throw errorWithPrefix;
      });

      await expect(
        service.validateBatchStudentAssignment(
          MOCK_CLASS_ID,
          [MOCK_STUDENT_ID],
          MOCK_SESSION_ID,
        ),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.validateBatchStudentAssignment(
          MOCK_CLASS_ID,
          [MOCK_STUDENT_ID],
          MOCK_SESSION_ID,
        ),
      ).rejects.toThrow('Cannot assign students: Some error message');
    });

    it('should replace single prefix with batch prefix', async () => {
      classModelAction.get.mockResolvedValue(mockClass);
      studentModelAction.get.mockResolvedValue(mockStudent);
      classStudentModelAction.list.mockResolvedValue({
        payload: [mockExistingAssignment],
        paginationMeta: {},
      });

      await expect(
        service.validateBatchStudentAssignment(
          MOCK_CLASS_ID,
          [MOCK_STUDENT_ID],
          MOCK_SESSION_ID,
        ),
      ).rejects.toThrow(ConflictException);

      const error = await service
        .validateBatchStudentAssignment(
          MOCK_CLASS_ID,
          [MOCK_STUDENT_ID],
          MOCK_SESSION_ID,
        )
        .catch((e) => e);

      expect(error.message).toContain('Cannot assign students:');
      expect(error.message).not.toContain('Cannot assign student:');
    });

    it('should work with transaction manager', async () => {
      classModelAction.get.mockResolvedValue(mockClass);
      studentModelAction.get.mockResolvedValue(mockStudent);
      mockManager.findOne.mockResolvedValue(null);

      await service.validateBatchStudentAssignment(
        MOCK_CLASS_ID,
        [MOCK_STUDENT_ID],
        MOCK_SESSION_ID,
        mockManager,
      );

      expect(mockManager.findOne).toHaveBeenCalled();
    });
  });

  describe('getExistingAssignment', () => {
    it('should return existing assignment if found', async () => {
      const existingAssignment = {
        id: 'assignment-uuid',
        class: { id: MOCK_CLASS_ID },
        student: { id: MOCK_STUDENT_ID },
        session_id: MOCK_SESSION_ID,
        is_active: true,
      } as unknown as ClassStudent;

      classStudentModelAction.list.mockResolvedValue({
        payload: [existingAssignment],
        paginationMeta: {},
      });

      const result = await service.getExistingAssignment(
        MOCK_CLASS_ID,
        MOCK_STUDENT_ID,
        MOCK_SESSION_ID,
      );

      expect(result).toEqual(existingAssignment);
      expect(classStudentModelAction.list).toHaveBeenCalledWith({
        filterRecordOptions: {
          class: { id: MOCK_CLASS_ID },
          student: { id: MOCK_STUDENT_ID },
          session_id: MOCK_SESSION_ID,
        },
      });
    });

    it('should return null if no assignment found', async () => {
      classStudentModelAction.list.mockResolvedValue({
        payload: [],
        paginationMeta: {},
      });

      const result = await service.getExistingAssignment(
        MOCK_CLASS_ID,
        MOCK_STUDENT_ID,
        MOCK_SESSION_ID,
      );

      expect(result).toBeNull();
    });

    it('should work with transaction manager', async () => {
      const existingAssignment = {
        id: 'assignment-uuid',
        class: { id: MOCK_CLASS_ID },
        student: { id: MOCK_STUDENT_ID },
        session_id: MOCK_SESSION_ID,
      } as unknown as ClassStudent;

      mockManager.findOne.mockResolvedValue(existingAssignment);

      const result = await service.getExistingAssignment(
        MOCK_CLASS_ID,
        MOCK_STUDENT_ID,
        MOCK_SESSION_ID,
        mockManager,
      );

      expect(result).toEqual(existingAssignment);
      expect(mockManager.findOne).toHaveBeenCalledWith(ClassStudent, {
        where: {
          class: { id: MOCK_CLASS_ID },
          student: { id: MOCK_STUDENT_ID },
          session_id: MOCK_SESSION_ID,
        },
      });
    });

    it('should return null with transaction manager if not found', async () => {
      mockManager.findOne.mockResolvedValue(null);

      const result = await service.getExistingAssignment(
        MOCK_CLASS_ID,
        MOCK_STUDENT_ID,
        MOCK_SESSION_ID,
        mockManager,
      );

      expect(result).toBeNull();
    });
  });
});
