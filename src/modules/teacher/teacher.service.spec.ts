import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository, QueryRunner } from 'typeorm';

import { UserRole } from '../shared/enums';
import { FileService } from '../shared/file/file.service';
import * as passwordUtil from '../shared/utils/password.util';
import { User } from '../user/entities/user.entity';

import { CreateTeacherDto, UpdateTeacherDto, GetTeachersQueryDto } from './dto';
import { Teacher } from './entities/teacher.entity';
import { TeacherTitle } from './enums/teacher.enum';
import { TeacherService } from './teacher.service';
import { generateEmploymentId } from './utils/employment-id.util';

// Mock the utilities
jest.mock('./utils/employment-id.util');
jest.mock('../shared/utils/password.util', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed_password'),
  generateStrongPassword: jest.fn().mockReturnValue('GeneratedPass123'),
}));

describe('TeacherService', () => {
  let service: TeacherService;
  let teacherRepository: jest.Mocked<Repository<Teacher>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let dataSource: jest.Mocked<DataSource>;
  let fileService: jest.Mocked<FileService>;
  let queryRunner: jest.Mocked<QueryRunner>;

  const mockUser: Partial<User> = {
    id: 'user-uuid-123',
    first_name: 'Favour',
    last_name: 'Chinaza',
    middle_name: 'Chinaza',
    email: 'favourchinaza110@gmail.com',
    phone: '+234 810 942 3124',
    gender: 'Female',
    dob: new Date('1990-11-23'),
    homeAddress: '123 Main Street',
    role: [UserRole.TEACHER],
    is_active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTeacher: Partial<Teacher> = {
    id: 1,
    userId: 'user-uuid-123',
    employmentId: 'EMP-2025-014',
    title: TeacherTitle.MISS,
    photoUrl: 'uploads/teachers/EMP-2025-014.jpg',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser as User,
  };

  beforeEach(async () => {
    // Mock QueryRunner
    const mockSave = jest.fn();
    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        save: mockSave,
      },
    } as unknown as jest.Mocked<QueryRunner>;

    // Mock repositories
    teacherRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<Teacher>>;

    userRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    // Mock DataSource
    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    } as unknown as jest.Mocked<DataSource>;

    // Mock FileService
    fileService = {
      validatePhotoUrl: jest.fn().mockImplementation((url: string) => url),
    } as unknown as jest.Mocked<FileService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherService,
        {
          provide: getRepositoryToken(Teacher),
          useValue: teacherRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: FileService,
          useValue: fileService,
        },
      ],
    }).compile();

    service = module.get<TeacherService>(TeacherService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePassword', () => {
    it('should generate a password with strength indicator', () => {
      const result = service.generatePassword();

      expect(result).toHaveProperty('password');
      expect(result).toHaveProperty('strength');
      expect(result.password).toBeTruthy();
      expect(['weak', 'medium', 'strong']).toContain(result.strength);
    });

    it('should generate strong password when all criteria met', () => {
      // Mock generateStrongPassword to return a strong password
      (passwordUtil.generateStrongPassword as jest.Mock).mockReturnValue(
        'StrongPass123',
      );

      const result = service.generatePassword();

      expect(result.strength).toBe('strong');
    });
  });

  describe('create', () => {
    const createDto: CreateTeacherDto = {
      title: TeacherTitle.MISS,
      first_name: 'Favour',
      last_name: 'Chinaza',
      middle_name: 'Chinaza',
      email: 'favourchinaza110@gmail.com',
      gender: 'Female',
      date_of_birth: '1990-11-23',
      phone: '+234 810 942 3124',
      home_address: '123 Main Street',
      is_active: true,
    };

    beforeEach(() => {
      (generateEmploymentId as jest.Mock).mockResolvedValue('EMP-2025-014');
      userRepository.findOne.mockResolvedValue(null);
      teacherRepository.findOne.mockResolvedValue(null);
      (queryRunner.manager.save as jest.Mock)
        .mockResolvedValueOnce(mockUser as User)
        .mockResolvedValueOnce(mockTeacher as Teacher);
    });

    it('should create a teacher successfully', async () => {
      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('employment_id');
      expect(result).toHaveProperty('first_name');
      expect(result).toHaveProperty('last_name');
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should auto-generate employment ID if not provided', async () => {
      const dtoWithoutId = { ...createDto };
      delete dtoWithoutId.employment_id;

      await service.create(dtoWithoutId);

      expect(generateEmploymentId).toHaveBeenCalled();
    });

    it('should use provided employment ID if given', async () => {
      const dtoWithId = { ...createDto, employment_id: 'EMP-2025-999' };
      teacherRepository.findOne.mockResolvedValueOnce(null);

      await service.create(dtoWithId);

      expect(generateEmploymentId).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      userRepository.findOne.mockResolvedValue(mockUser as User);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw ConflictException if employment ID already exists', async () => {
      teacherRepository.findOne.mockResolvedValue(mockTeacher as Teacher);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should validate photo URL if provided', async () => {
      const dtoWithPhoto = {
        ...createDto,
        photo_url: 'https://example.com/photos/teacher123.jpg',
      };

      await service.create(dtoWithPhoto);

      expect(fileService.validatePhotoUrl).toHaveBeenCalledWith(
        'https://example.com/photos/teacher123.jpg',
      );
    });

    it('should auto-generate password if not provided', async () => {
      await service.create(createDto);

      expect(passwordUtil.generateStrongPassword).toHaveBeenCalledWith(12);
    });

    it('should rollback transaction on error', async () => {
      // Reset mocks
      (queryRunner.manager.save as jest.Mock).mockReset();
      (queryRunner.manager.save as jest.Mock).mockRejectedValueOnce(
        new Error('Database error'),
      );

      await expect(service.create(createDto)).rejects.toThrow();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated list of teachers', async () => {
      const query: GetTeachersQueryDto = {
        page: 1,
        limit: 20,
        sort_by: 'created_at',
        order: 'desc',
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockTeacher as Teacher]),
      };

      teacherRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(query);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('total_pages');
      expect(result.data).toBeInstanceOf(Array);
    });

    it('should filter by active status', async () => {
      const query: GetTeachersQueryDto = {
        page: 1,
        limit: 20,
        is_active: true,
        sort_by: 'created_at',
        order: 'desc',
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockTeacher as Teacher]),
      };

      teacherRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      await service.findAll(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'teacher.is_active = :isActive',
        { isActive: true },
      );
    });

    it('should search by name, email, or employment ID', async () => {
      const query: GetTeachersQueryDto = {
        page: 1,
        limit: 20,
        search: 'Favour',
        sort_by: 'created_at',
        order: 'desc',
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockTeacher as Teacher]),
      };

      teacherRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      await service.findAll(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('LOWER'),
        expect.objectContaining({ searchTerm: expect.any(String) }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a teacher by ID', async () => {
      teacherRepository.findOne.mockResolvedValue(mockTeacher as Teacher);

      const result = await service.findOne(1);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.employment_id).toBe('EMP-2025-014');
      expect(teacherRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['user'],
      });
    });

    it('should throw NotFoundException if teacher not found', async () => {
      teacherRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateTeacherDto = {
      first_name: 'Updated',
      last_name: 'Name',
    };

    beforeEach(() => {
      teacherRepository.findOne.mockResolvedValue(mockTeacher as Teacher);
      (queryRunner.manager.save as jest.Mock)
        .mockResolvedValueOnce({ ...mockUser, ...updateDto } as User)
        .mockResolvedValueOnce(mockTeacher as Teacher);
    });

    it('should update teacher successfully', async () => {
      const result = await service.update(1, updateDto);

      expect(result).toBeDefined();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if teacher not found', async () => {
      teacherRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if trying to update employment ID', async () => {
      const updateWithId = { ...updateDto, employment_id: 'EMP-2025-999' };

      await expect(service.update(1, updateWithId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should validate photo URL when updating', async () => {
      const updateWithPhoto = {
        ...updateDto,
        photo_url: 'https://example.com/photos/new-teacher123.jpg',
      };

      await service.update(1, updateWithPhoto);

      expect(fileService.validatePhotoUrl).toHaveBeenCalledWith(
        'https://example.com/photos/new-teacher123.jpg',
      );
    });

    it('should allow setting photo_url to null when updating', async () => {
      const updateWithNullPhoto = {
        ...updateDto,
        photo_url: null,
      };

      await service.update(1, updateWithNullPhoto);

      // Should not throw and should complete successfully
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      // Reset mocks
      (queryRunner.manager.save as jest.Mock).mockReset();
      (queryRunner.manager.save as jest.Mock).mockRejectedValueOnce(
        new Error('Update failed'),
      );

      await expect(service.update(1, updateDto)).rejects.toThrow();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      teacherRepository.findOne.mockResolvedValue(mockTeacher as Teacher);
      teacherRepository.save.mockResolvedValue(mockTeacher as Teacher);
      userRepository.save.mockResolvedValue(mockUser as User);
    });

    it('should deactivate teacher and user', async () => {
      await service.remove(1);

      expect(teacherRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: false }),
      );
    });

    it('should throw NotFoundException if teacher not found', async () => {
      teacherRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
