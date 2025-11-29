import { Test, TestingModule } from '@nestjs/testing';

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
});
