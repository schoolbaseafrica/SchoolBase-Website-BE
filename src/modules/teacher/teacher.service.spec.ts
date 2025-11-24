import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { Logger } from 'winston';

import { UserRole } from '../shared/enums';
import { FileService } from '../shared/file/file.service';
import * as passwordUtil from '../shared/utils/password.util';
import { User } from '../user/entities/user.entity';
import { UserModelAction } from '../user/model-actions/user-actions';

import { CreateTeacherDto, GetTeachersQueryDto, UpdateTeacherDto } from './dto';
import { Teacher } from './entities/teacher.entity';
import { TeacherTitle } from './enums/teacher.enum';
import { TeacherModelAction } from './model-actions/teacher-actions';
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
  let dataSource: jest.Mocked<DataSource>;
  let fileService: jest.Mocked<FileService>;
  let teacherModelAction: jest.Mocked<TeacherModelAction>;
  let userModelAction: jest.Mocked<UserModelAction>;
  let queryRunner: jest.Mocked<QueryRunner>;
  let mockLogger: jest.Mocked<Logger>;

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

  const mockTeacherId = 'teacher-uuid-123';
  const mockTeacher: Partial<Teacher> = {
    id: mockTeacherId,
    user_id: 'user-uuid-123',
    employment_id: 'EMP-2025-014',
    title: TeacherTitle.MISS,
    photo_url: 'uploads/teachers/EMP-2025-014.jpg',
    is_active: true,
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

    // Mock DataSource
    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
      transaction: jest.fn().mockImplementation(async (callback) => {
        // Simulate transaction by calling callback with queryRunner.manager
        return callback(queryRunner.manager);
      }),
    } as unknown as jest.Mocked<DataSource>;

    // Mock FileService
    fileService = {
      validatePhotoUrl: jest.fn().mockImplementation((url: string) => url),
    } as unknown as jest.Mocked<FileService>;

    // Mock Model Actions
    teacherModelAction = {
      get: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      list: jest.fn(),
    } as unknown as jest.Mocked<TeacherModelAction>;

    userModelAction = {
      get: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<UserModelAction>;

    // Mock Logger
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(),
      child: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<Logger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherService,
        {
          provide: TeacherModelAction,
          useValue: teacherModelAction,
        },
        {
          provide: UserModelAction,
          useValue: userModelAction,
        },
        {
          provide: getRepositoryToken(Teacher),
          useValue: teacherRepository,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: FileService,
          useValue: fileService,
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
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
      userModelAction.get.mockResolvedValue(null);
      teacherModelAction.get.mockResolvedValue(null);
      userModelAction.create.mockResolvedValue(mockUser as User);
      teacherModelAction.create.mockResolvedValue(mockTeacher as Teacher);
    });

    it('should create a teacher successfully', async () => {
      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('employment_id');
      expect(result).toHaveProperty('first_name');
      expect(result).toHaveProperty('last_name');
      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('should auto-generate employment ID if not provided', async () => {
      const dtoWithoutId = { ...createDto };
      delete dtoWithoutId.employment_id;

      await service.create(dtoWithoutId);

      expect(generateEmploymentId).toHaveBeenCalled();
    });

    it('should use provided employment ID if given', async () => {
      const dtoWithId = { ...createDto, employment_id: 'EMP-2025-999' };
      teacherModelAction.get.mockResolvedValueOnce(null);

      await service.create(dtoWithId);

      expect(generateEmploymentId).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      userModelAction.get.mockResolvedValue(mockUser as User);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      // Transaction is not called if validation fails before transaction starts
    });

    it('should throw ConflictException if employment ID already exists', async () => {
      teacherModelAction.get.mockResolvedValue(mockTeacher as Teacher);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      // Transaction is not called if validation fails before transaction starts
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
      userModelAction.create.mockReset();
      userModelAction.create.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.create(createDto)).rejects.toThrow();
      // Transaction will automatically rollback on error
      expect(dataSource.transaction).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated list of teachers', async () => {
      const query: GetTeachersQueryDto = {
        page: 1,
        limit: 20,
        sort_by: 'employment_id',
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
        sort_by: 'employment_id',
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
        'teacher.is_active = :is_active',
        { is_active: true },
      );
    });

    it('should search by name, email, or employment ID', async () => {
      const query: GetTeachersQueryDto = {
        page: 1,
        limit: 20,
        search: 'Favour',
        sort_by: 'employment_id',
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
        expect.stringContaining('ILIKE'),
        expect.objectContaining({
          searchTerm: expect.any(String),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a teacher by ID', async () => {
      teacherModelAction.get.mockResolvedValue(mockTeacher as Teacher);

      const result = await service.findOne(mockTeacherId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockTeacherId);
      expect(result.employment_id).toBe('EMP-2025-014');
      expect(teacherModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: mockTeacherId },
        relations: { user: true },
      });
    });

    it('should throw NotFoundException if teacher not found', async () => {
      teacherModelAction.get.mockResolvedValue(null);

      await expect(service.findOne('non-existent-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateTeacherDto = {
      first_name: 'Updated',
      last_name: 'Name',
    };

    beforeEach(() => {
      teacherModelAction.get.mockResolvedValue(mockTeacher as Teacher);
      userModelAction.update.mockResolvedValue({
        ...mockUser,
        ...updateDto,
      } as User);
      teacherModelAction.update.mockResolvedValue(mockTeacher as Teacher);
    });

    it('should update teacher successfully', async () => {
      const result = await service.update(mockTeacherId, updateDto);

      expect(result).toBeDefined();
      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if teacher not found', async () => {
      teacherModelAction.get.mockResolvedValue(null);

      await expect(
        service.update('non-existent-uuid', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if trying to update employment ID', async () => {
      const updateWithId = { ...updateDto, employment_id: 'EMP-2025-999' };

      await expect(service.update(mockTeacherId, updateWithId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should validate photo URL when updating', async () => {
      const updateWithPhoto = {
        ...updateDto,
        photo_url: 'https://example.com/photos/new-teacher123.jpg',
      };

      await service.update(mockTeacherId, updateWithPhoto);

      expect(fileService.validatePhotoUrl).toHaveBeenCalledWith(
        'https://example.com/photos/new-teacher123.jpg',
      );
    });

    it('should allow setting photo_url to null when updating', async () => {
      const updateWithNullPhoto = {
        ...updateDto,
        photo_url: null,
      };

      await service.update(mockTeacherId, updateWithNullPhoto);

      // Should not throw and should complete successfully
      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      // Reset mocks
      userModelAction.update.mockReset();
      userModelAction.update.mockRejectedValueOnce(new Error('Update failed'));

      await expect(service.update(mockTeacherId, updateDto)).rejects.toThrow();
      // Transaction will automatically rollback on error
      expect(dataSource.transaction).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      teacherModelAction.get.mockResolvedValue(mockTeacher as Teacher);
      teacherModelAction.update.mockResolvedValue(mockTeacher as Teacher);
      userModelAction.update.mockResolvedValue(mockUser as User);
    });

    it('should deactivate teacher and user', async () => {
      await service.remove(mockTeacherId);

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(teacherModelAction.update).toHaveBeenCalledWith({
        identifierOptions: { id: mockTeacherId },
        updatePayload: { is_active: false },
        transactionOptions: {
          useTransaction: true,
          transaction: queryRunner.manager,
        },
      });
      expect(userModelAction.update).toHaveBeenCalledWith({
        identifierOptions: { id: mockUser.id },
        updatePayload: { is_active: false },
        transactionOptions: {
          useTransaction: true,
          transaction: queryRunner.manager,
        },
      });
    });

    it('should throw NotFoundException if teacher not found', async () => {
      teacherModelAction.get.mockResolvedValue(null);

      await expect(service.remove('non-existent-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
