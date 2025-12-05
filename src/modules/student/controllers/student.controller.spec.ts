import { Test, TestingModule } from '@nestjs/testing';

import * as sysMsg from 'src/constants/system.messages';

import { StudentProfileResponseDto } from '../dto';
import { StudentService } from '../services';

import { StudentController } from './student.controller';

const mockStudentService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getMyProfile: jest.fn(),
} as unknown as jest.Mocked<StudentService>;

describe('StudentController', () => {
  let controller: StudentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentController],
      providers: [{ provide: StudentService, useValue: mockStudentService }],
    }).compile();

    controller = module.get<StudentController>(StudentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyProfile', () => {
    it("should call studentService.getMyProfile with the correct studentId and return the student's profile", async () => {
      // Arrange
      const studentId = 'a-student-uuid';
      const mockProfile = {
        message: sysMsg.PROFILE_RETRIEVED,
        data: { id: studentId },
      } as unknown as StudentProfileResponseDto;

      mockStudentService.getMyProfile.mockResolvedValue(mockProfile);

      const result = await controller.getMyProfile(studentId);

      // Assert contions to validate the logic of the controller
      expect(mockStudentService.getMyProfile).toHaveBeenCalledTimes(1);
      expect(mockStudentService.getMyProfile).toHaveBeenCalledWith(studentId);
      expect(result).toEqual(mockProfile);
    });
  });
});
