import { Test, TestingModule } from '@nestjs/testing';

import { UserRole } from '../../shared/enums';
import {
  CreateGradeSubmissionDto,
  GradeSubmissionResponseDto,
  ListGradeSubmissionsDto,
} from '../dto';
import { GradeSubmissionStatus } from '../entities';
import { GradeSubmissionService } from '../services';

import { GradeSubmissionController } from './grade-submission.controller';

interface IRequestWithUser extends Request {
  user: {
    id: string;
    userId: string;
    teacher_id?: string;
    roles: UserRole[];
  };
}

describe('GradeController', () => {
  let controller: GradeSubmissionController;
  let service: jest.Mocked<GradeSubmissionService>;

  const mockTeacherId = 'teacher-uuid-123';
  const mockSubmissionId = 'submission-uuid-123';
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
      controllers: [GradeSubmissionController],
      providers: [
        {
          provide: GradeSubmissionService,
          useValue: {
            createSubmission: jest.fn(),
            listTeacherSubmissions: jest.fn(),
            getSubmission: jest.fn(),
            submitForApproval: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GradeSubmissionController>(
      GradeSubmissionController,
    );
    service = module.get(GradeSubmissionService);
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

      service.createSubmission.mockResolvedValue(
        expectedResult as GradeSubmissionResponseDto,
      );

      const result = await controller.createSubmission(
        mockRequest as unknown as IRequestWithUser,
        createDto,
      );

      expect(result).toEqual(expectedResult);
      expect(service.createSubmission).toHaveBeenCalledWith(
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

      service.listTeacherSubmissions.mockResolvedValue(expectedResult);

      const result = await controller.listTeacherSubmissions(
        mockRequest as unknown as IRequestWithUser,
        listDto,
      );

      expect(result).toEqual(expectedResult);
      expect(service.listTeacherSubmissions).toHaveBeenCalledWith(
        mockTeacherId,
        listDto,
      );
    });
  });

  describe('getSubmission', () => {
    it('should get submission for teacher', async () => {
      const expectedResult = { id: mockSubmissionId };

      service.getSubmission.mockResolvedValue(
        expectedResult as GradeSubmissionResponseDto,
      );

      const result = await controller.getSubmission(
        mockRequest as unknown as IRequestWithUser,
        mockSubmissionId,
      );

      expect(result).toEqual(expectedResult);
      expect(service.getSubmission).toHaveBeenCalledWith(
        mockSubmissionId,
        mockTeacherId,
      );
    });

    it('should get submission for admin without teacher check', async () => {
      const expectedResult = { id: mockSubmissionId };
      service.getSubmission.mockResolvedValue(
        expectedResult as GradeSubmissionResponseDto,
      );

      const result = await controller.getSubmission(
        mockAdminRequest as unknown as IRequestWithUser,
        mockSubmissionId,
      );

      expect(result).toEqual(expectedResult);
      expect(service.getSubmission).toHaveBeenCalledWith(
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

      service.submitForApproval.mockResolvedValue(
        expectedResult as GradeSubmissionResponseDto,
      );

      const result = await controller.submitForApproval(
        mockRequest as unknown as IRequestWithUser,
        mockSubmissionId,
      );

      expect(result).toEqual(expectedResult);
      expect(service.submitForApproval).toHaveBeenCalledWith(
        mockTeacherId,
        mockSubmissionId,
      );
    });
  });
});
