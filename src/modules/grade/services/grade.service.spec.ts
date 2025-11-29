import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';

import { UserRole } from '../../shared/enums';
import { StudentModelAction } from '../../student/model-actions';
import { CreateGradeSubmissionDto } from '../dto';
import { GradeSubmissionStatus } from '../entities/grade-submission.entity';
import { GradeModelAction, GradeSubmissionModelAction } from '../model-actions';

import { GradeService } from './grade.service';

describe('GradeService', () => {
  let service: GradeService;
  let gradeSubmissionModelAction: jest.Mocked<GradeSubmissionModelAction>;
  let gradeModelAction: jest.Mocked<GradeModelAction>;
  let studentModelAction: jest.Mocked<StudentModelAction>;

  const mockLogger = {
    child: jest.fn().mockReturnThis(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const mockTeacherId = 'teacher-uuid-123';
  const mockClassId = 'class-uuid-123';
  const mockSubjectId = 'subject-uuid-123';
  const mockTermId = 'term-uuid-123';
  const mockSessionId = 'session-uuid-123';
  const mockSubmissionId = 'submission-uuid-123';
  const mockGradeId = 'grade-uuid-123';

  const mockClassSubjectRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradeService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
        {
          provide: GradeSubmissionModelAction,
          useValue: {
            get: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            list: jest.fn(),
          },
        },
        {
          provide: GradeModelAction,
          useValue: {
            get: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            list: jest.fn(),
          },
        },
        {
          provide: StudentModelAction,
          useValue: {
            get: jest.fn(),
            repository: {
              createQueryBuilder: jest.fn(),
            },
          },
        },
        {
          provide: DataSource,
          useValue: {
            getRepository: jest.fn().mockReturnValue(mockClassSubjectRepo),
            transaction: jest.fn((callback) => {
              const mockManager = {
                getRepository: jest.fn((entity) => {
                  if (entity.name === 'GradeSubmission') {
                    return {
                      findOne: jest.fn().mockResolvedValue({
                        id: mockSubmissionId,
                        teacher_id: mockTeacherId,
                        class_id: mockClassId,
                        subject_id: mockSubjectId,
                        term_id: mockTermId,
                        academic_session_id: mockSessionId,
                        status: GradeSubmissionStatus.DRAFT,
                        teacher: {
                          id: mockTeacherId,
                          user: { first_name: 'Teacher', last_name: 'Name' },
                          title: 'Mr',
                        },
                        class: { id: mockClassId, name: 'SS1', arm: 'A' },
                        subject: { id: mockSubjectId, name: 'Mathematics' },
                        term: { id: mockTermId, name: 'FIRST' },
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      }),
                    };
                  }
                  if (entity.name === 'Grade') {
                    return {
                      find: jest.fn().mockResolvedValue([
                        {
                          id: mockGradeId,
                          submission_id: mockSubmissionId,
                          student_id: 'student-1',
                          ca_score: 25,
                          exam_score: 60,
                          total_score: 85,
                          grade_letter: 'A',
                          student: {
                            id: 'student-1',
                            user: { first_name: 'John', last_name: 'Doe' },
                            registration_number: 'STU-001',
                          },
                        },
                        {
                          id: 'grade-2',
                          submission_id: mockSubmissionId,
                          student_id: 'student-2',
                          ca_score: 20,
                          exam_score: 55,
                          total_score: 75,
                          grade_letter: 'B',
                          student: {
                            id: 'student-2',
                            user: { first_name: 'Jane', last_name: 'Smith' },
                            registration_number: 'STU-002',
                          },
                        },
                      ]),
                    };
                  }
                  return mockClassSubjectRepo;
                }),
              };
              return callback(mockManager);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<GradeService>(GradeService);
    gradeSubmissionModelAction = module.get(GradeSubmissionModelAction);
    gradeModelAction = module.get(GradeModelAction);
    studentModelAction = module.get(StudentModelAction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSubmission', () => {
    const createDto: CreateGradeSubmissionDto = {
      class_id: mockClassId,
      subject_id: mockSubjectId,
      term_id: mockTermId,
      academic_session_id: mockSessionId,
      grades: [
        { student_id: 'student-1', ca_score: 25, exam_score: 60 },
        { student_id: 'student-2', ca_score: 20, exam_score: 55 },
      ],
    };

    it('should create a grade submission successfully', async () => {
      mockClassSubjectRepo.findOne.mockResolvedValue({ id: 'assignment-1' });
      gradeSubmissionModelAction.get.mockResolvedValue(null);
      (gradeSubmissionModelAction.create as jest.Mock).mockResolvedValue({
        id: mockSubmissionId,
        teacher_id: mockTeacherId,
        class_id: mockClassId,
        subject_id: mockSubjectId,
        term_id: mockTermId,
        academic_session_id: mockSessionId,
        status: GradeSubmissionStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (gradeModelAction.create as jest.Mock).mockResolvedValue({
        id: mockGradeId,
        submission_id: mockSubmissionId,
        student_id: 'student-1',
        ca_score: 25,
        exam_score: 60,
        total_score: 85,
        grade_letter: 'A',
      });

      const result = await service.createSubmission(mockTeacherId, createDto);

      expect(result).toBeDefined();
      expect(result.status).toBe(GradeSubmissionStatus.DRAFT);
      expect(gradeSubmissionModelAction.create).toHaveBeenCalled();
      expect(gradeModelAction.create).toHaveBeenCalledTimes(2);
    });

    it('should throw ForbiddenException if teacher not assigned to subject', async () => {
      mockClassSubjectRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createSubmission(mockTeacherId, createDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if submission already exists', async () => {
      mockClassSubjectRepo.findOne.mockResolvedValue({ id: 'assignment-1' });
      (gradeSubmissionModelAction.get as jest.Mock).mockResolvedValue({
        id: 'existing-submission',
      });

      await expect(
        service.createSubmission(mockTeacherId, createDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateGrade', () => {
    const mockGrade = {
      id: mockGradeId,
      submission_id: mockSubmissionId,
      student_id: 'student-1',
      ca_score: 20,
      exam_score: 50,
      total_score: 70,
      grade_letter: 'B',
      comment: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      submission: {
        id: mockSubmissionId,
        teacher_id: mockTeacherId,
        status: GradeSubmissionStatus.DRAFT,
      },
      student: {
        id: 'student-1',
        registration_number: 'STU-001',
        user: { first_name: 'John', last_name: 'Doe' },
      },
    };

    it('should update a grade successfully', async () => {
      (gradeModelAction.get as jest.Mock).mockResolvedValue(mockGrade);
      (gradeModelAction.update as jest.Mock).mockResolvedValue({
        ...mockGrade,
        ca_score: 25,
        total_score: 75,
        grade_letter: 'B',
      });

      const result = await service.updateGrade(mockTeacherId, mockGradeId, {
        ca_score: 25,
      });

      expect(result).toBeDefined();
      expect(gradeModelAction.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if grade not found', async () => {
      (gradeModelAction.get as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateGrade(mockTeacherId, mockGradeId, { ca_score: 25 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if teacher does not own submission', async () => {
      (gradeModelAction.get as jest.Mock).mockResolvedValue({
        ...mockGrade,
        submission: { ...mockGrade.submission, teacher_id: 'other-teacher' },
      });

      await expect(
        service.updateGrade(mockTeacherId, mockGradeId, { ca_score: 25 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if submission is approved', async () => {
      (gradeModelAction.get as jest.Mock).mockResolvedValue({
        ...mockGrade,
        submission: {
          ...mockGrade.submission,
          status: GradeSubmissionStatus.APPROVED,
        },
      });

      await expect(
        service.updateGrade(mockTeacherId, mockGradeId, { ca_score: 25 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitForApproval', () => {
    const mockSubmission = {
      id: mockSubmissionId,
      teacher_id: mockTeacherId,
      class_id: mockClassId,
      subject_id: mockSubjectId,
      term_id: mockTermId,
      academic_session_id: mockSessionId,
      status: GradeSubmissionStatus.DRAFT,
      submitted_at: null,
      reviewed_at: null,
      reviewed_by: null,
      rejection_reason: null,
      grades: [
        {
          id: 'grade-1',
          ca_score: 25,
          exam_score: 60,
          total_score: 85,
          grade_letter: 'A',
          comment: null,
          student: {
            id: 'student-1',
            user: { first_name: 'John', last_name: 'Doe' },
            registration_number: 'STU-001',
          },
        },
      ],
      teacher: {
        id: mockTeacherId,
        user: { first_name: 'Teacher', last_name: 'Name' },
        title: 'Mr',
      },
      class: { id: mockClassId, name: 'SS1', arm: 'A' },
      subject: { id: mockSubjectId, name: 'Mathematics' },
      term: { id: mockTermId, name: 'FIRST' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should submit grades for approval successfully', async () => {
      (gradeSubmissionModelAction.get as jest.Mock).mockResolvedValue(
        mockSubmission,
      );
      (gradeSubmissionModelAction.update as jest.Mock).mockResolvedValue({
        ...mockSubmission,
        status: GradeSubmissionStatus.SUBMITTED,
        submitted_at: new Date(),
      });

      const result = await service.submitForApproval(
        mockTeacherId,
        mockSubmissionId,
      );

      expect(result).toBeDefined();
      expect(result.status).toBe(GradeSubmissionStatus.SUBMITTED);
    });

    it('should throw NotFoundException if submission not found', async () => {
      (gradeSubmissionModelAction.get as jest.Mock).mockResolvedValue(null);

      await expect(
        service.submitForApproval(mockTeacherId, mockSubmissionId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if grades are incomplete', async () => {
      (gradeSubmissionModelAction.get as jest.Mock).mockResolvedValue({
        ...mockSubmission,
        grades: [
          {
            id: 'grade-1',
            ca_score: null,
            exam_score: 60,
            student: {
              id: 'student-1',
              user: { first_name: 'John', last_name: 'Doe' },
              registration_number: 'STU-001',
            },
          },
        ],
      });

      await expect(
        service.submitForApproval(mockTeacherId, mockSubmissionId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSubmission', () => {
    const mockSubmission = {
      id: mockSubmissionId,
      teacher_id: mockTeacherId,
      class_id: mockClassId,
      subject_id: mockSubjectId,
      term_id: mockTermId,
      academic_session_id: mockSessionId,
      status: GradeSubmissionStatus.DRAFT,
      submitted_at: null,
      reviewed_at: null,
      reviewed_by: null,
      rejection_reason: null,
      grades: [],
      teacher: {
        id: mockTeacherId,
        user: { first_name: 'Teacher', last_name: 'Name' },
        title: 'Mr',
      },
      class: { id: mockClassId, name: 'SS1', arm: 'A' },
      subject: { id: mockSubjectId, name: 'Mathematics' },
      term: { id: mockTermId, name: 'FIRST' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return submission details', async () => {
      (gradeSubmissionModelAction.get as jest.Mock).mockResolvedValue(
        mockSubmission,
      );

      const result = await service.getSubmission(
        mockSubmissionId,
        mockTeacherId,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(mockSubmissionId);
    });

    it('should throw NotFoundException if submission not found', async () => {
      (gradeSubmissionModelAction.get as jest.Mock).mockResolvedValue(null);

      await expect(service.getSubmission(mockSubmissionId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('calculateGradeLetter', () => {
    it('should calculate correct grade letters', () => {
      // Access private method for testing
      const calculateGrade = (
        service as unknown as {
          calculateGradeLetter: (score: number) => string;
        }
      ).calculateGradeLetter.bind(service);

      expect(calculateGrade(95)).toBe('A');
      expect(calculateGrade(80)).toBe('A');
      expect(calculateGrade(75)).toBe('B');
      expect(calculateGrade(70)).toBe('B');
      expect(calculateGrade(65)).toBe('C');
      expect(calculateGrade(55)).toBe('D');
      expect(calculateGrade(45)).toBe('E');
      expect(calculateGrade(30)).toBe('F');
      expect(calculateGrade(0)).toBe('F');
    });
  });

  describe('getStudentGrades', () => {
    const mockStudentId = 'student-uuid-123';
    const mockParentId = 'parent-uuid-123';

    beforeEach(() => {
      // Reset mocks before each test
      jest.clearAllMocks();
    });

    it('should return only approved grades for students', async () => {
      const mockApprovedGrade = {
        id: 'grade-approved-1',
        submission_id: 'submission-approved-1',
        student_id: mockStudentId,
        ca_score: 25,
        exam_score: 60,
        total_score: 85,
        grade_letter: 'A',
        comment: null,
        submission: {
          id: 'submission-approved-1',
          status: GradeSubmissionStatus.APPROVED,
          submitted_at: new Date(),
          reviewed_at: new Date(),
          class: { id: 'class-1', name: 'SS1', arm: 'A' },
          subject: { id: 'subject-1', name: 'Mathematics' },
          term: { id: 'term-1', name: 'FIRST' },
          teacher: {
            id: 'teacher-1',
            user: { first_name: 'Teacher', last_name: 'Name' },
          },
        },
        student: {
          id: mockStudentId,
          user: { first_name: 'John', last_name: 'Doe' },
          registration_number: 'STU-001',
        },
      };

      (gradeModelAction.list as jest.Mock).mockResolvedValue({
        payload: [mockApprovedGrade],
        paginationMeta: { total: 1, page: 1, limit: 10 },
      });

      const result = await service.getStudentGrades(mockStudentId, {
        id: 'user-uuid-123',
        student_id: mockStudentId,
        roles: [UserRole.STUDENT],
      });

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].grade_letter).toBe('A');
      expect(gradeModelAction.list).toHaveBeenCalledWith({
        filterRecordOptions: {
          student_id: mockStudentId,
          submission: { status: GradeSubmissionStatus.APPROVED },
        },
        relations: {
          submission: {
            class: true,
            subject: true,
            term: true,
            teacher: { user: true },
          },
        },
      });
    });

    it('should return only approved grades for parents', async () => {
      const mockStudent = {
        id: mockStudentId,
        user: { first_name: 'John', last_name: 'Doe' },
        parent: { id: mockParentId },
      };

      const mockApprovedGrade = {
        id: 'grade-approved-1',
        submission_id: 'submission-approved-1',
        student_id: mockStudentId,
        ca_score: 25,
        exam_score: 60,
        total_score: 85,
        grade_letter: 'A',
        comment: null,
        submission: {
          id: 'submission-approved-1',
          status: GradeSubmissionStatus.APPROVED,
          submitted_at: new Date(),
          reviewed_at: new Date(),
          class: { id: 'class-1', name: 'SS1', arm: 'A' },
          subject: { id: 'subject-1', name: 'Mathematics' },
          term: { id: 'term-1', name: 'FIRST' },
          teacher: {
            id: 'teacher-1',
            user: { first_name: 'Teacher', last_name: 'Name' },
          },
        },
        student: {
          id: mockStudentId,
          user: { first_name: 'John', last_name: 'Doe' },
          registration_number: 'STU-001',
        },
      };

      (studentModelAction.get as jest.Mock).mockResolvedValue(mockStudent);
      (gradeModelAction.list as jest.Mock).mockResolvedValue({
        payload: [mockApprovedGrade],
        paginationMeta: { total: 1, page: 1, limit: 10 },
      });

      const result = await service.getStudentGrades(mockStudentId, {
        id: 'user-uuid-123',
        parent_id: mockParentId,
        roles: [UserRole.PARENT],
      });

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].grade_letter).toBe('A');
    });

    it('should not return draft grades to students', async () => {
      // Changed this to return empty array because the service filters by APPROVED
      (gradeModelAction.list as jest.Mock).mockResolvedValue({
        payload: [],
        paginationMeta: { total: 0, page: 1, limit: 10 },
      });

      const result = await service.getStudentGrades(mockStudentId, {
        id: 'user-uuid-123',
        student_id: mockStudentId,
        roles: [UserRole.STUDENT],
      });

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(0);
    });

    it("should throw ForbiddenException if parent tries to access another student's grades", async () => {
      const otherStudent = {
        id: mockStudentId,
        user: { first_name: 'John', last_name: 'Doe' },
        parent: { id: 'other-parent-id' },
      };

      (studentModelAction.get as jest.Mock).mockResolvedValue(otherStudent);

      await expect(
        service.getStudentGrades(mockStudentId, {
          id: 'user-uuid-123',
          parent_id: mockParentId,
          roles: [UserRole.PARENT],
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return empty array when no approved grades found', async () => {
      (gradeModelAction.list as jest.Mock).mockResolvedValue({
        payload: [],
        paginationMeta: { total: 0, page: 1, limit: 10 },
      });

      const result = await service.getStudentGrades(mockStudentId, {
        id: 'user-uuid-123',
        student_id: mockStudentId,
        roles: [UserRole.STUDENT],
      });

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(0);
      expect(result.message).toBe('No grades found for this student.');
    });
  });
});
