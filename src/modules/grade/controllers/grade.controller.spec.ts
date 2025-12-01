import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import * as sysMsg from '../../../constants/system.messages';
import { TermName } from '../../academic-term/entities/term.entity';
import { UserRole } from '../../shared/enums';
import { GradeResponseDto, UpdateGradeDto } from '../dto';
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
  const mockGradeId = 'grade-uuid-123';

  const mockRequest = {
    user: {
      id: 'user-uuid-123',
      userId: 'user-uuid-123',
      teacher_id: mockTeacherId,
      roles: [UserRole.TEACHER],
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
            getStudentGrades: jest.fn(),
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

  describe('getStudentGrades', () => {
    it('should get grades for a student', async () => {
      const studentId = 'student-uuid-456';
      const mockStudentRequest = {
        user: {
          id: 'user-uuid-456',
          userId: 'user-uuid-456',
          student_id: studentId,
          roles: [UserRole.STUDENT],
        },
      };
      const expectedResult = {
        message: sysMsg.GRADES_FETCHED,
        data: [
          {
            id: 'grade-uuid-789',
            class: { id: 'class-1', name: 'JSS1', arm: 'A' },
            subject: { id: 'subject-1', name: 'Mathematics' },
            term: { id: 'term-1', name: TermName.FIRST },
            teacher: { id: 'teacher-1', name: 'Mr. John' },
            ca_score: 30,
            exam_score: 55,
            total_score: 85,
            grade_letter: 'A',
            comment: 'Excellent',
            submitted_at: new Date(),
          },
        ],
      };

      gradeService.getStudentGrades.mockResolvedValue(expectedResult);

      const result = await controller.getStudentGrades(
        mockStudentRequest as unknown as IRequestWithUser,
        studentId,
      );

      expect(result).toEqual(expectedResult);
      expect(gradeService.getStudentGrades).toHaveBeenCalledWith(
        studentId,
        mockStudentRequest.user,
      );
    });

    it('should get grades for a student when requested by a parent', async () => {
      const studentId = 'student-uuid-789';
      const parentId = 'parent-uuid-123';
      const mockParentRequest = {
        user: {
          id: 'user-uuid-789',
          userId: 'user-uuid-789',
          parent_id: parentId,
          roles: [UserRole.PARENT],
        },
      };
      const expectedResult = {
        message: sysMsg.GRADES_FETCHED,
        data: [
          {
            id: 'grade-uuid-101',
            class: { id: 'class-2', name: 'JSS2', arm: 'B' },
            subject: { id: 'subject-2', name: 'English' },
            term: { id: 'term-2', name: TermName.SECOND },
            teacher: { id: 'teacher-2', name: 'Mrs. Jane' },
            ca_score: 35,
            exam_score: 57,
            total_score: 92,
            grade_letter: 'A',
            comment: 'Very Good',
            submitted_at: new Date(),
          },
        ],
      };

      gradeService.getStudentGrades.mockResolvedValue(expectedResult);

      const result = await controller.getStudentGrades(
        mockParentRequest as unknown as IRequestWithUser,
        studentId,
      );

      expect(result).toEqual(expectedResult);
      expect(gradeService.getStudentGrades).toHaveBeenCalledWith(
        studentId,
        mockParentRequest.user,
      );
    });

    it("should throw ForbiddenException when a student tries to access another student's grades", async () => {
      const studentId = 'student-uuid-456';
      const anotherStudentId = 'student-uuid-789';
      const mockStudentRequest = {
        user: {
          id: 'user-uuid-456',
          userId: 'user-uuid-456',
          student_id: studentId,
          roles: [UserRole.STUDENT],
        },
      };

      gradeService.getStudentGrades.mockRejectedValue(
        new ForbiddenException(sysMsg.UNAUTHORIZED_GRADE_ACCESS),
      );

      await expect(
        controller.getStudentGrades(
          mockStudentRequest as unknown as IRequestWithUser,
          anotherStudentId,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should throw ForbiddenException when a parent tries to access another student's grades", async () => {
      const parentId = 'parent-uuid-123';
      const anotherStudentId = 'student-uuid-456';
      const mockParentRequest = {
        user: {
          id: 'user-uuid-789',
          userId: 'user-uuid-789',
          parent_id: parentId,
          roles: [UserRole.PARENT],
        },
      };

      gradeService.getStudentGrades.mockRejectedValue(
        new ForbiddenException(sysMsg.UNAUTHORIZED_GRADE_ACCESS),
      );

      await expect(
        controller.getStudentGrades(
          mockParentRequest as unknown as IRequestWithUser,
          anotherStudentId,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return empty data array when a student has no grades', async () => {
      const studentId = 'student-uuid-456';
      const mockStudentRequest = {
        user: {
          id: 'user-uuid-456',
          userId: 'user-uuid-456',
          student_id: studentId,
          roles: [UserRole.STUDENT],
        },
      };
      const expectedResult = {
        message: sysMsg.GRADES_FETCHED,
        data: [],
      };

      gradeService.getStudentGrades.mockResolvedValue(expectedResult);

      const result = await controller.getStudentGrades(
        mockStudentRequest as unknown as IRequestWithUser,
        studentId,
      );

      expect(result).toEqual(expectedResult);
      expect(gradeService.getStudentGrades).toHaveBeenCalledWith(
        studentId,
        mockStudentRequest.user,
      );
    });

    it('should throw NotFoundException when requesting grades for a non-existent student', async () => {
      const nonExistentStudentId = 'non-existent-student-uuid';
      const mockStudentRequest = {
        user: {
          id: 'user-uuid-456',
          userId: 'user-uuid-456',
          student_id: 'student-uuid-456',
          roles: [UserRole.STUDENT],
        },
      };

      gradeService.getStudentGrades.mockRejectedValue(
        new NotFoundException(sysMsg.STUDENT_NOT_FOUND),
      );

      await expect(
        controller.getStudentGrades(
          mockStudentRequest as unknown as IRequestWithUser,
          nonExistentStudentId,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
