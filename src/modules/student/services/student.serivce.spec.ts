import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../../constants/system.messages';
import { ClassStudentModelAction } from '../../../modules/class/model-actions/class-student.action';
import { ClassModelAction } from '../../../modules/class/model-actions/class.actions';
import { User } from '../../../modules/user/entities/user.entity';
import { AcademicSessionModelAction } from '../../academic-session/model-actions/academic-session-actions';
import { FileService } from '../../shared/file/file.service';
import { UserModelAction } from '../../user/model-actions/user-actions';
import { StudentProfileResponseDto } from '../dto';
import { Student } from '../entities';
import { StudentModelAction } from '../model-actions';

import { StudentService } from './student.service';

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  log: jest.fn(),
  child: jest.fn().mockReturnThis(),
} as unknown as jest.Mocked<Logger>;

const mockStudentModelAction = {
  get: jest.fn(),
  create: jest.fn(),
  generateRegistrationNumber: jest.fn(),
};

const mockUserModelAction = {
  get: jest.fn(),
  create: jest.fn(),
};

const mockDataSource = {
  transaction: jest.fn(),
};

const mockFileService = {
  validatePhotoUrl: jest.fn(),
} as unknown as jest.Mocked<FileService>;

const mockClassStudentModelAction = { list: jest.fn() };
const mockClassModelAction = { find: jest.fn() };
const mockAcademicSessionModelAction = { find: jest.fn() };

describe('StudentService', () => {
  let service: StudentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
        {
          provide: StudentModelAction,
          useValue: mockStudentModelAction,
        },
        {
          provide: UserModelAction,
          useValue: mockUserModelAction,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: FileService,
          useValue: mockFileService,
        },
        {
          provide: ClassStudentModelAction,
          useValue: mockClassStudentModelAction,
        },
        {
          provide: ClassModelAction,
          useValue: mockClassModelAction,
        },
        {
          provide: AcademicSessionModelAction,
          useValue: mockAcademicSessionModelAction,
        },
      ],
    }).compile();

    service = module.get<StudentService>(StudentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMyProfile', () => {
    const studentId = 'a-student-uuid';

    it('should return the student profile when found', async () => {
      // Arrange
      const mockUser = { id: 'user-uuid', email: 'student@test.com' } as User;
      // The mockStudent needs to have the full nested structure expected by StudentProfileResponseDto
      const mockStudent = {
        id: studentId,
        is_deleted: false,
        user: mockUser,
        stream: {
          id: 'stream-uuid',
          name: 'Stream A',
          class: {
            id: 'class-uuid',
            name: 'JSS1',
            academicSession: {
              id: 'session-uuid',
              academicYear: '2023/2024',
              name: '2023/2024 Session',
              startDate: new Date('2023-09-01'),
              endDate: new Date('2024-06-30'),
            },
          },
        },
      } as Student;
      const expectedResponse = new StudentProfileResponseDto(
        mockStudent,
        mockUser,
        sysMsg.PROFILE_RETRIEVED,
      );

      mockStudentModelAction.get.mockResolvedValue(mockStudent);

      // Act
      const result = await service.getMyProfile(studentId);

      // Assert
      expect(mockStudentModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: studentId },
        relations: { user: true, stream: true },
      });
      expect(result).toEqual(expectedResponse);
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Fetched student profile for user ID: ${studentId}`,
      );
    });

    it('should throw NotFoundException if student profile is not found', async () => {
      // Arrange
      mockStudentModelAction.get.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getMyProfile(studentId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Student profile not found for user ID: ${studentId}`,
      );
    });

    it('should throw NotFoundException if student profile is soft-deleted', async () => {
      // Arrange
      const mockStudent = { id: 'a-student-uuid', is_deleted: true } as Student;
      mockStudentModelAction.get.mockResolvedValue(mockStudent);

      // Act & Assert
      await expect(service.getMyProfile(studentId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
