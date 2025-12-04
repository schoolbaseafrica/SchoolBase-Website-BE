import { PaginationMeta } from '@hng-sdk/orm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';

import { SessionStatus } from 'src/modules/academic-session/entities/academic-session.entity';
import {
  TermName,
  TermStatus,
} from 'src/modules/academic-term/entities/term.entity';
import { Student } from 'src/modules/student/entities/student.entity';

import { AcademicSessionModelAction } from '../../academic-session/model-actions/academic-session-actions';
import { TermModelAction } from '../../academic-term/model-actions';
import { Class } from '../../class/entities/class.entity';
import { ClassStudentModelAction } from '../../class/model-actions/class-student.action';
import { ClassModelAction } from '../../class/model-actions/class.actions';
import { GradeModelAction } from '../../grade/model-actions';
import { StudentModelAction } from '../../student/model-actions/student-actions';
import { Result } from '../entities';
import {
  ResultModelAction,
  ResultSubjectLineModelAction,
} from '../model-actions';

import { ResultService } from './result.service';

describe('ResultService', () => {
  let service: ResultService;
  let resultModelAction: jest.Mocked<ResultModelAction>;
  let classModelAction: jest.Mocked<ClassModelAction>;
  let classStudentModelAction: jest.Mocked<ClassStudentModelAction>;
  let termModelAction: jest.Mocked<TermModelAction>;
  let academicSessionModelAction: jest.Mocked<AcademicSessionModelAction>;
  let studentModelAction: StudentModelAction;

  const mockLogger = {
    child: jest.fn().mockReturnThis(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      save: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockUser = {
    id: 'user1',
    first_name: 'John',
    last_name: 'Doe',
    middle_name: null,
    gender: null,
    dob: null,
    email: 'john.doe@example.com',
    phone: '1234567890',
    google_id: null,
    homeAddress: null,
    role: [],
    password: 'hashedpassword',
    is_active: true,
    is_verified: true,
    sessions: [],
    teacher: null,
    last_login_at: null,
    reset_token: null,
    reset_token_expiry: null,
    deleted_at: null,
    stream: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockStudent = {
    id: 'student1',
    registration_number: 'REG001',
    photo_url: null,
    user: mockUser,
    stream: null,
    class_assignments: [],
    is_deleted: false,
    deleted_at: null,
    parent: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAcademicSession = {
    id: 'session1',
    academicYear: '2023/2024',
    name: '2023/2024 Session',
    startDate: new Date(),
    endDate: new Date(),
    description: null,
    status: SessionStatus.ACTIVE,
    terms: [],
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTerm = {
    id: 'term1',
    sessionId: mockAcademicSession.id,
    academicSession: mockAcademicSession,
    name: TermName.FIRST,
    startDate: new Date(),
    endDate: new Date(),
    status: TermStatus.ACTIVE,
    isCurrent: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockClass = {
    id: 'class1',
    name: 'JSS1',
    stream: 'A',
    arm: 'A',
    room: null,
    academicSession: mockAcademicSession,
    teacher_assignment: [],
    student_assignments: [],
    streams: [],
    timetable: null,
    classSubjects: [],
    is_deleted: false,
    deleted_at: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockResult = {
    id: 'result1',
    student_id: 'student1',
    student: mockStudent,
    class_id: 'class1',
    class: mockClass,
    term_id: 'term1',
    term: mockTerm,
    academic_session_id: 'session1',
    academicSession: mockAcademicSession,
    total_score: 80,
    average_score: 80,
    grade_letter: 'A',
    position: 1,
    remark: 'Excellent',
    subject_count: 5,
    generated_at: new Date(),
    subject_lines: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPaginationMeta: PaginationMeta = {
    total: 1,
    limit: 10,
    page: 1,
    total_pages: 1,
    has_next: false,
    has_previous: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResultService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
        {
          provide: ResultModelAction,
          useValue: {
            get: jest.fn(),
            list: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: ResultSubjectLineModelAction,
          useValue: {
            create: jest.fn(),
            list: jest.fn(),
          },
        },
        {
          provide: GradeModelAction,
          useValue: {
            list: jest.fn(),
          },
        },
        {
          provide: ClassModelAction,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: ClassStudentModelAction,
          useValue: {
            list: jest.fn(),
          },
        },
        {
          provide: TermModelAction,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: AcademicSessionModelAction,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: StudentModelAction,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
          },
        },
      ],
    }).compile();

    service = module.get<ResultService>(ResultService);
    resultModelAction = module.get(ResultModelAction);
    studentModelAction = module.get<StudentModelAction>(StudentModelAction);
    classModelAction = module.get(ClassModelAction);
    classStudentModelAction = module.get(ClassStudentModelAction);
    termModelAction = module.get(TermModelAction);
    academicSessionModelAction = module.get(AcademicSessionModelAction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getResultById', () => {
    it('should return a result when found', async () => {
      const mockResultId = 'result-uuid-123';
      const mockResult = {
        id: mockResultId,
        student_id: 'student-uuid-123',
        class_id: 'class-uuid-123',
        term_id: 'term-uuid-123',
        academic_session_id: 'session-uuid-123',
        total_score: 450,
        average_score: 75,
        grade_letter: 'B',
        position: 5,
        remark: 'Very Good',
        subject_count: 6,
        generated_at: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        student: {
          id: 'student-uuid-123',
          registration_number: 'STU001',
          user: {
            first_name: 'John',
            last_name: 'Doe',
          },
        },
        class: {
          id: 'class-uuid-123',
          name: 'SS1',
          arm: 'A',
        },
        term: {
          id: 'term-uuid-123',
          name: 'FIRST',
        },
        academicSession: {
          id: 'session-uuid-123',
          name: '2024/2025',
          academicYear: '2024/2025',
        },
        subject_lines: [],
      };

      resultModelAction.get.mockResolvedValue(mockResult as unknown as Result);

      const result = await service.getResultById(mockResultId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockResultId);
      expect(resultModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: mockResultId },
        relations: expect.objectContaining({
          student: { user: true },
          class: true,
          term: true,
          academicSession: true,
          subject_lines: { subject: true },
        }),
      });
    });

    it('should throw NotFoundException when result not found', async () => {
      const mockResultId = 'result-uuid-123';

      resultModelAction.get.mockResolvedValue(null);

      await expect(service.getResultById(mockResultId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('generateClassResults', () => {
    it('should throw NotFoundException when class does not exist', async () => {
      const classId = 'class-uuid-123';
      const termId = 'term-uuid-123';

      classModelAction.get.mockResolvedValue(null);

      await expect(
        service.generateClassResults(classId, termId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when no students found', async () => {
      const classId = 'class-uuid-123';
      const termId = 'term-uuid-123';
      const sessionId = 'session-uuid-123';

      classModelAction.get.mockResolvedValue({
        id: classId,
        is_deleted: false,
        academicSession: { id: sessionId },
      } as unknown as Class);

      termModelAction.get.mockResolvedValue({
        id: termId,
        academicSession: { id: sessionId },
      } as unknown as Awaited<ReturnType<typeof termModelAction.get>>);

      academicSessionModelAction.get.mockResolvedValue({
        id: sessionId,
      } as unknown as Awaited<
        ReturnType<typeof academicSessionModelAction.get>
      >);

      classStudentModelAction.list.mockResolvedValue({
        payload: [],
      } as unknown as Awaited<ReturnType<typeof classStudentModelAction.list>>);

      await expect(
        service.generateClassResults(classId, termId, sessionId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStudentResults', () => {
    const studentId = 'student1';
    const query = {};

    it('should throw NotFoundException if student does not exist', async () => {
      jest.spyOn(studentModelAction, 'get').mockResolvedValue(null);
      await expect(service.getStudentResults(studentId, query)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if student is deleted', async () => {
      jest
        .spyOn(studentModelAction, 'get')
        .mockResolvedValue({ ...mockStudent, is_deleted: true } as Student);
      await expect(service.getStudentResults(studentId, query)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return an empty array if no results are found', async () => {
      jest.spyOn(studentModelAction, 'get').mockResolvedValue(mockStudent);
      jest.spyOn(resultModelAction, 'list').mockResolvedValue({
        payload: [],
        paginationMeta: { ...mockPaginationMeta, total: 0 },
      });

      const result = await service.getStudentResults(studentId, query);
      expect(result.meta.total).toEqual(0);
    });

    it('should return a list of results for a valid student', async () => {
      jest.spyOn(studentModelAction, 'get').mockResolvedValue(mockStudent);
      jest.spyOn(resultModelAction, 'list').mockResolvedValue({
        payload: [mockResult],
        paginationMeta: mockPaginationMeta,
      });

      const result = await service.getStudentResults(studentId, query);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(
        service['transformToResponseDto'](mockResult),
      );
    });

    it('should filter results by term_id if provided', async () => {
      const queryWithTerm = { term_id: 'term1' };
      jest.spyOn(studentModelAction, 'get').mockResolvedValue(mockStudent);
      jest.spyOn(resultModelAction, 'list').mockResolvedValue({
        payload: [mockResult],
        paginationMeta: mockPaginationMeta,
      });

      await service.getStudentResults(studentId, queryWithTerm);
      expect(resultModelAction.list).toHaveBeenCalledWith({
        filterRecordOptions: { student_id: studentId, term_id: 'term1' },
        relations: expect.any(Object),
        order: expect.any(Object),
        paginationPayload: expect.any(Object),
      });
    });

    it('should filter results by academic_session_id if provided', async () => {
      const queryWithSession = { academic_session_id: 'session1' };
      jest.spyOn(studentModelAction, 'get').mockResolvedValue(mockStudent);
      jest.spyOn(resultModelAction, 'list').mockResolvedValue({
        payload: [mockResult],
        paginationMeta: mockPaginationMeta,
      });

      await service.getStudentResults(studentId, queryWithSession);
      expect(resultModelAction.list).toHaveBeenCalledWith({
        filterRecordOptions: {
          student_id: studentId,
          academic_session_id: 'session1',
        },
        relations: expect.any(Object),
        order: expect.any(Object),
        paginationPayload: expect.any(Object),
      });
    });

    it('should return paginated results', async () => {
      const paginatedQuery = { page: 2, limit: 5 };
      jest.spyOn(studentModelAction, 'get').mockResolvedValue(mockStudent);
      jest.spyOn(resultModelAction, 'list').mockResolvedValue({
        payload: [mockResult],
        paginationMeta: {
          ...mockPaginationMeta,
          page: 2,
          limit: 5,
          has_next: true,
          has_previous: true,
        },
      });

      await service.getStudentResults(studentId, paginatedQuery);
      expect(resultModelAction.list).toHaveBeenCalledWith({
        filterRecordOptions: { student_id: studentId },
        relations: expect.any(Object),
        order: expect.any(Object),
        paginationPayload: { page: 2, limit: 5 },
      });
    });
  });
});
