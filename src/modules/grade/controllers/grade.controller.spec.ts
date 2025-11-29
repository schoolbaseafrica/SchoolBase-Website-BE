import { Test, TestingModule } from '@nestjs/testing';

import * as sysMsg from '../../../constants/system.messages';
import { UserRole } from '../../shared/enums';
import {
  CreateGradeSubmissionDto,
  GradeResponseDto,
  GradeSubmissionResponseDto,
  ListGradeSubmissionsDto,
  UpdateGradeDto,
} from '../dto';
import { GradeSubmissionStatus } from '../entities/grade-submission.entity';
import { GradeService } from '../services/grade.service';

import { GradeController } from './grade.controller';

interface IRequestWithUser extends Request {
  user: {
    id: string;
    userId: string;
    teacher_id?: string;
    roles: UserRole[];
  };
}

describe('GradeController', () => {
  let controller: GradeController;
  let gradeService: jest.Mocked<GradeService>;

  const mockTeacherId = 'teacher-uuid-123';
  const mockSubmissionId = 'submission-uuid-123';
  const mockGradeId = 'grade-uuid-123';
  const mockClassId = 'class-uuid-123';
  const mockSubjectId = 'subject-uuid-123';

  const mockRequest = {
    user: {
      id: 'user-uuid-123',
      userId: 'user-uuid-123',
      teacher_id: mockTeacherId,
      roles: [UserRole.TEACHER],
    },
  };

  const mockAdminRequest = {
    user: {
      id: 'admin-uuid-123',
      userId: 'admin-uuid-123',
      roles: [UserRole.ADMIN],
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GradeController],
      providers: [
        {
          provide: GradeService,
          useValue: {
            createSubmission: jest.fn(),
            listTeacherSubmissions: jest.fn(),
            getSubmission: jest.fn(),
            submitForApproval: jest.fn(),
            updateGrade: jest.fn(),
            getStudentsForClass: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GradeController>(GradeController);
    gradeService = module.get(GradeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSubmission', () => {
    it('should create a grade submission', async () => {
      const createDto: CreateGradeSubmissionDto = {
        class_id: mockClassId,
        subject_id: mockSubjectId,
        term_id: 'term-uuid',
        academic_session_id: 'session-uuid',
        grades: [{ student_id: 'student-1', ca_score: 25, exam_score: 60 }],
      };

      const expectedResult = {
        id: mockSubmissionId,
        status: GradeSubmissionStatus.DRAFT,
        student_count: 1,
      };

      gradeService.createSubmission.mockResolvedValue(
        expectedResult as GradeSubmissionResponseDto,
      );

      const result = await controller.createSubmission(
        mockRequest as unknown as IRequestWithUser,
        createDto,
      );

      expect(result).toEqual(expectedResult);
      expect(gradeService.createSubmission).toHaveBeenCalledWith(
        mockTeacherId,
        createDto,
      );
    });
  });

  describe('listTeacherSubmissions', () => {
    it('should list teacher submissions', async () => {
      const listDto: ListGradeSubmissionsDto = { page: 1, limit: 10 };
      const expectedResult = {
        data: [],
        meta: { total: 0, page: 1, limit: 10 },
      };

      gradeService.listTeacherSubmissions.mockResolvedValue(expectedResult);

      const result = await controller.listTeacherSubmissions(
        mockRequest as unknown as IRequestWithUser,
        listDto,
      );

      expect(result).toEqual(expectedResult);
      expect(gradeService.listTeacherSubmissions).toHaveBeenCalledWith(
        mockTeacherId,
        listDto,
      );
    });
  });

  describe('getSubmission', () => {
    it('should get submission for teacher', async () => {
      const expectedResult = { id: mockSubmissionId };

      gradeService.getSubmission.mockResolvedValue(
        expectedResult as GradeSubmissionResponseDto,
      );

      const result = await controller.getSubmission(
        mockRequest as unknown as IRequestWithUser,
        mockSubmissionId,
      );

      expect(result).toEqual(expectedResult);
      expect(gradeService.getSubmission).toHaveBeenCalledWith(
        mockSubmissionId,
        mockTeacherId,
      );
    });

    it('should get submission for admin without teacher check', async () => {
      const expectedResult = { id: mockSubmissionId };

      gradeService.getSubmission.mockResolvedValue(
        expectedResult as GradeSubmissionResponseDto,
      );

      const result = await controller.getSubmission(
        mockAdminRequest as unknown as IRequestWithUser,
        mockSubmissionId,
      );

      expect(result).toEqual(expectedResult);
      expect(gradeService.getSubmission).toHaveBeenCalledWith(
        mockSubmissionId,
        undefined,
      );
    });
  });

  describe('submitForApproval', () => {
    it('should submit grades for approval', async () => {
      const expectedResult = {
        id: mockSubmissionId,
        status: GradeSubmissionStatus.SUBMITTED,
      };

      gradeService.submitForApproval.mockResolvedValue(
        expectedResult as GradeSubmissionResponseDto,
      );

      const result = await controller.submitForApproval(
        mockRequest as unknown as IRequestWithUser,
        mockSubmissionId,
      );

      expect(result).toEqual(expectedResult);
      expect(gradeService.submitForApproval).toHaveBeenCalledWith(
        mockTeacherId,
        mockSubmissionId,
      );
    });
  });

  describe('updateGrade', () => {
    it('should update a grade', async () => {
      const updateDto: UpdateGradeDto = { ca_score: 28 };
      const expectedResult = { id: mockGradeId, ca_score: 28 };

      gradeService.updateGrade.mockResolvedValue(
        expectedResult as GradeResponseDto,
      );

      const result = await controller.updateGrade(
        mockRequest as unknown as IRequestWithUser,
        mockGradeId,
        updateDto,
      );

      expect(result).toEqual(expectedResult);
      expect(gradeService.updateGrade).toHaveBeenCalledWith(
        mockTeacherId,
        mockGradeId,
        updateDto,
      );
    });
  });

  describe('getStudentsForClass', () => {
    it('should get students for a class', async () => {
      const students = [
        { id: 'student-1', name: 'John Doe', registration_number: 'STU-001' },
      ];
      const expectedResult = {
        message: sysMsg.STUDENTS_FETCHED,
        data: students,
      };

      gradeService.getStudentsForClass.mockResolvedValue(students);

      const result = await controller.getStudentsForClass(
        mockRequest as unknown as IRequestWithUser,
        mockClassId,
        mockSubjectId,
      );

      expect(result).toEqual(expectedResult);
      expect(gradeService.getStudentsForClass).toHaveBeenCalledWith(
        mockClassId,
        mockTeacherId,
        mockSubjectId,
      );
    });
  });
});
