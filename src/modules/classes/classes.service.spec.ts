import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { Class } from './entities/classes.entity';
import { ClassTeacher } from './entities/class-teacher.entity';

// Mock Data Constants
const MOCK_CLASS_ID = 1;
const MOCK_sessionId = '2023-2024';
const MOCK_ACTIVE_SESSION = '2024-2025';

const mockClass = {
  id: MOCK_CLASS_ID,
  name: 'Grade 10',
  stream: 'Science',
} as unknown as Class;

const mockTeacherAssignment = {
  id: 10,
  assignment_date: new Date('2023-09-01'),
  sessionId: MOCK_sessionId,
  is_active: true,
  teacher: {
    id: 101,
    name: 'John Doe',
    email: 'john@school.com',
  },
  class: mockClass,
} as unknown as ClassTeacher;

describe('ClassesService', () => {
  let service: ClassesService;
  let classRepository: Repository<Class>;
  let classTeacherRepository: Repository<ClassTeacher>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesService,
        {
          provide: getRepositoryToken(Class),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ClassTeacher),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ClassesService>(ClassesService);
    classRepository = module.get<Repository<Class>>(getRepositoryToken(Class));
    classTeacherRepository = module.get<Repository<ClassTeacher>>(
      getRepositoryToken(ClassTeacher),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTeachersByClass', () => {
    it('should return a list of mapped teachers for a specific session', async () => {
      // Arrange
      jest.spyOn(classRepository, 'findOne').mockResolvedValue(mockClass);
      jest
        .spyOn(classTeacherRepository, 'find')
        .mockResolvedValue([mockTeacherAssignment]);

      // Act
      const result = await service.getTeachersByClass(
        MOCK_CLASS_ID,
        MOCK_sessionId,
      );

      // Assert
      expect(classTeacherRepository.find).toHaveBeenCalledWith({
        where: {
          class: { id: MOCK_CLASS_ID },
          sessionId: MOCK_sessionId, // Expecting snake_case
          is_active: true,
        },
        relations: ['teacher', 'class'],
        // Updated to match the specific structure from your error log
        select: {
          id: true,
          assignment_date: true,
          teacher: {
            id: true,
            name: true,
          },
          class: {
            id: true,
            stream: true,
          },
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        teacher_id: 101,
        name: 'John Doe',
        assignment_date: mockTeacherAssignment.assignment_date,
        stream: 'Science',
      });
    });

    it('should use the active session if no session ID is provided', async () => {
      // Arrange
      jest.spyOn(classRepository, 'findOne').mockResolvedValue(mockClass);
      jest
        .spyOn(classTeacherRepository, 'find')
        .mockResolvedValue([mockTeacherAssignment]);

      // Act
      await service.getTeachersByClass(MOCK_CLASS_ID);

      // Assert
      expect(classTeacherRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sessionId: MOCK_ACTIVE_SESSION, // Expecting snake_case
          }),
        }),
      );
    });

    it('should throw NotFoundException if the class does not exist', async () => {
      jest.spyOn(classRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.getTeachersByClass(999, MOCK_sessionId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return an empty array if class exists but has no teachers', async () => {
      jest.spyOn(classRepository, 'findOne').mockResolvedValue(mockClass);
      jest.spyOn(classTeacherRepository, 'find').mockResolvedValue([]);

      const result = await service.getTeachersByClass(
        MOCK_CLASS_ID,
        MOCK_sessionId,
      );

      expect(result).toEqual([]);
    });
  });
});