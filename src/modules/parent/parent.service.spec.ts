import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import {
  DataSource,
  QueryRunner,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { Logger } from 'winston';

import { ClassStudent } from '../class/entities/class-student.entity';
import { ClassSubject } from '../class/entities/class-subject.entity';
import { ClassStudentModelAction } from '../class/model-actions/class-student.action';
import { ClassSubjectModelAction } from '../class/model-actions/class-subject.action';
import { UserRole } from '../shared/enums';
import { FileService } from '../shared/file/file.service';
import * as passwordUtil from '../shared/utils/password.util';
import { Student } from '../student/entities/student.entity';
import { StudentModelAction } from '../student/model-actions/student-actions';
import { User } from '../user/entities/user.entity';
import { UserModelAction } from '../user/model-actions/user-actions';

import { CreateParentDto, LinkStudentsDto, UpdateParentDto } from './dto';
import { Parent } from './entities/parent.entity';
import { ParentModelAction } from './model-actions/parent-actions';
import { ParentService, IUserPayload } from './parent.service';

// Helper type to access protected repository in tests
type MockModelAction = {
  repository: {
    find: jest.Mock;
  };
};

// Mock the password utilities
jest.mock('../shared/utils/password.util', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed_password'),
  generateStrongPassword: jest.fn().mockReturnValue('GeneratedPass123'),
}));

// Create a type for our mock query builder
type MockQueryBuilder = {
  leftJoinAndSelect: jest.Mock;
  orderBy: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  getCount: jest.Mock;
  skip: jest.Mock;
  take: jest.Mock;
  getMany: jest.Mock;
};

describe('ParentService', () => {
  let service: ParentService;
  let parentRepository: jest.Mocked<Repository<Parent>>;
  let dataSource: jest.Mocked<DataSource>;
  let fileService: jest.Mocked<FileService>;
  let parentModelAction: jest.Mocked<ParentModelAction>;
  let userModelAction: jest.Mocked<UserModelAction>;
  let studentModelAction: jest.Mocked<StudentModelAction>;
  let classStudentModelAction: jest.Mocked<ClassStudentModelAction>;
  let classSubjectModelAction: jest.Mocked<ClassSubjectModelAction>;
  let queryRunner: jest.Mocked<QueryRunner>;
  let mockLogger: jest.Mocked<Logger>;

  const mockUser: Partial<User> = {
    id: 'user-uuid-123',
    first_name: 'John',
    last_name: 'Doe',
    middle_name: 'Michael',
    email: 'john.doe@example.com',
    phone: '+234 810 942 3124',
    gender: 'Male',
    dob: new Date('1985-05-15'),
    homeAddress: '123 Main Street',
    role: [UserRole.PARENT],
    is_active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserPayload: IUserPayload = {
    id: 'user-uuid-123',
    email: 'john.doe@example.com',
    roles: [UserRole.PARENT],
  };

  const mockParentId = 'parent-uuid-123';
  const mockParent: Partial<Parent> = {
    id: mockParentId,
    user_id: 'user-uuid-123',
    photo_url: 'https://example.com/photos/parent123.jpg',
    is_active: true,
    deleted_at: null,
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

    // Create a simple mock query builder with only the methods we need
    const mockQueryBuilder: MockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    // Mock repositories
    parentRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(
        () => mockQueryBuilder as unknown as SelectQueryBuilder<Parent>,
      ),
    } as unknown as jest.Mocked<Repository<Parent>>;

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
    parentModelAction = {
      get: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      list: jest.fn(),
      repository: parentRepository,
    } as unknown as jest.Mocked<ParentModelAction>;

    userModelAction = {
      get: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<UserModelAction>;

    studentModelAction = {
      get: jest.fn(),
      update: jest.fn(),
      list: jest.fn(),
    } as unknown as jest.Mocked<StudentModelAction>;

    classStudentModelAction = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ClassStudentModelAction>;

    classSubjectModelAction = {
      repository: {
        find: jest.fn(),
      },
    } as unknown as jest.Mocked<ClassSubjectModelAction>;

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
        ParentService,
        {
          provide: ParentModelAction,
          useValue: parentModelAction,
        },
        {
          provide: UserModelAction,
          useValue: userModelAction,
        },
        {
          provide: getRepositoryToken(Parent),
          useValue: parentRepository,
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
          provide: StudentModelAction,
          useValue: studentModelAction,
        },
        {
          provide: ClassStudentModelAction,
          useValue: classStudentModelAction,
        },
        {
          provide: ClassSubjectModelAction,
          useValue: classSubjectModelAction,
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<ParentService>(ParentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateParentDto = {
      first_name: 'John',
      last_name: 'Doe',
      middle_name: 'Michael',
      email: 'john.doe@example.com',
      gender: 'Male',
      date_of_birth: '1985-05-15',
      phone: '+234 810 942 3124',
      home_address: '123 Main Street',
      password: 'TestPassword123',
      is_active: true,
    };

    beforeEach(() => {
      userModelAction.get.mockResolvedValue(null);
      userModelAction.create.mockResolvedValue(mockUser as User);
      parentModelAction.create.mockResolvedValue(mockParent as Parent);
    });

    it('should create a parent successfully', async () => {
      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('first_name', 'John');
      expect(result).toHaveProperty('last_name', 'Doe');
      expect(result).toHaveProperty('email', 'john.doe@example.com');
      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('should hash the password before creating user', async () => {
      await service.create(createDto);

      expect(passwordUtil.hashPassword).toHaveBeenCalledWith('TestPassword123');
      expect(userModelAction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            password: 'hashed_password',
          }),
        }),
      );
    });

    it('should create user with PARENT role', async () => {
      await service.create(createDto);

      expect(userModelAction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            role: [UserRole.PARENT],
          }),
        }),
      );
    });

    it('should create user with is_active set to true by default', async () => {
      // Use object destructuring with eslint disable for unused variables
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { is_active, ...dtoWithoutActive } = createDto;

      await service.create(dtoWithoutActive);

      expect(userModelAction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            is_active: true,
          }),
        }),
      );
    });

    it('should auto-generate password if not provided', async () => {
      // Use object destructuring with eslint disable for unused variables
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...dtoWithoutPassword } = createDto;

      await service.create(dtoWithoutPassword);

      expect(passwordUtil.hashPassword).toHaveBeenCalledWith(
        'GeneratedPass123',
      );
    });

    it('should validate photo URL if provided', async () => {
      const dtoWithPhoto = {
        ...createDto,
        photo_url: 'https://example.com/photos/parent123.jpg',
      };

      await service.create(dtoWithPhoto);

      expect(fileService.validatePhotoUrl).toHaveBeenCalledWith(
        'https://example.com/photos/parent123.jpg',
      );
      expect(parentModelAction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            photo_url: 'https://example.com/photos/parent123.jpg',
          }),
        }),
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      userModelAction.get.mockResolvedValue(mockUser as User);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'User with email john.doe@example.com already exists.',
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should create both user and parent in a transaction', async () => {
      await service.create(createDto);

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(userModelAction.create).toHaveBeenCalled();
      expect(parentModelAction.create).toHaveBeenCalled();
    });

    it('should link parent to created user', async () => {
      await service.create(createDto);

      expect(parentModelAction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            user_id: 'user-uuid-123',
          }),
        }),
      );
    });

    it('should set parent is_active from DTO', async () => {
      const dtoWithInactive = { ...createDto, is_active: false };

      await service.create(dtoWithInactive);

      expect(parentModelAction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            is_active: false,
          }),
        }),
      );
    });

    it('should log successful creation', async () => {
      await service.create(createDto);

      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a parent by id', async () => {
      parentModelAction.get.mockResolvedValue(mockParent as Parent);

      const result = await service.findOne(mockParentId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockParentId);
      expect(parentModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: mockParentId },
        relations: { user: true },
      });
    });

    it('should throw NotFoundException if parent not found', async () => {
      parentModelAction.get.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if parent is soft deleted', async () => {
      const deletedParent = {
        ...mockParent,
        deleted_at: new Date(),
      } as Parent;

      parentModelAction.get.mockResolvedValue(deletedParent);

      await expect(service.findOne(mockParentId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Parent not found with ID: ${mockParentId}`,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated parents without search', async () => {
      const mockParents = [mockParent as Parent];

      // Get the mock query builder instance and cast to our mock type
      const mockQueryBuilder =
        parentRepository.createQueryBuilder() as unknown as MockQueryBuilder;
      mockQueryBuilder.getCount = jest.fn().mockResolvedValue(1);
      mockQueryBuilder.getMany = jest.fn().mockResolvedValue(mockParents);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.paginationMeta.total).toBe(1);
      expect(result.paginationMeta.page).toBe(1);
      expect(result.paginationMeta.limit).toBe(10);

      // Verify query builder was used
      expect(parentRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'parent.user',
        'user',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'parent.deleted_at IS NULL',
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'parent.createdAt',
        'DESC',
      );
      // Should not call andWhere when there's no search
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it('should use query builder for search when search term is provided', async () => {
      const mockParents = [mockParent as Parent];

      // Get the mock query builder instance and cast to our mock type
      const mockQueryBuilder =
        parentRepository.createQueryBuilder() as unknown as MockQueryBuilder;
      mockQueryBuilder.getCount = jest.fn().mockResolvedValue(1);
      mockQueryBuilder.getMany = jest.fn().mockResolvedValue(mockParents);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        search: 'John',
      });

      expect(result.data).toHaveLength(1);

      // Verify query builder was used for search
      expect(parentRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'parent.user',
        'user',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'parent.deleted_at IS NULL',
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'parent.createdAt',
        'DESC',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.email ILIKE :search)',
        { search: '%John%' },
      );

      // Regular list should not be called when search is provided
      expect(parentModelAction.list).not.toHaveBeenCalled();
    });

    it('should log search information without search term', async () => {
      const mockParents = [mockParent as Parent];

      // Get the mock query builder instance and cast to our mock type
      const mockQueryBuilder =
        parentRepository.createQueryBuilder() as unknown as MockQueryBuilder;
      mockQueryBuilder.getCount = jest.fn().mockResolvedValue(1);
      mockQueryBuilder.getMany = jest.fn().mockResolvedValue(mockParents);

      await service.findAll({ page: 1, limit: 10 });

      expect(mockLogger.info).toHaveBeenCalledWith(
        `Fetched ${mockParents.length} parents`,
        {
          searchTerm: undefined,
          page: 1,
          limit: 10,
          total: 1,
        },
      );
    });

    it('should log search information with search term', async () => {
      const mockParents = [mockParent as Parent];

      // Get the mock query builder instance and cast to our mock type
      const mockQueryBuilder =
        parentRepository.createQueryBuilder() as unknown as MockQueryBuilder;
      mockQueryBuilder.getCount = jest.fn().mockResolvedValue(1);
      mockQueryBuilder.getMany = jest.fn().mockResolvedValue(mockParents);

      await service.findAll({ page: 1, limit: 10, search: 'test' });

      expect(mockLogger.info).toHaveBeenCalledWith(
        `Fetched ${mockParents.length} parents`,
        {
          searchTerm: 'test',
          page: 1,
          limit: 10,
          total: 1, // From getCount mock
        },
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateParentDto = {
      first_name: 'Updated',
      last_name: 'Name',
    };

    beforeEach(() => {
      parentModelAction.get.mockResolvedValue(mockParent as Parent);
      // Default: no email conflict (email doesn't exist for another user)
      userModelAction.get.mockResolvedValue(null);
      userModelAction.update.mockResolvedValue({
        ...mockUser,
        ...updateDto,
      } as User);
      parentModelAction.update.mockResolvedValue(mockParent as Parent);
    });

    it('should update parent successfully', async () => {
      const result = await service.update(mockParentId, updateDto);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('id', mockParentId);
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(parentModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: mockParentId },
        relations: { user: true },
      });
    });

    it('should throw NotFoundException if parent not found', async () => {
      parentModelAction.get.mockResolvedValue(null);

      await expect(
        service.update('non-existent-uuid', updateDto),
      ).rejects.toThrow(NotFoundException);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Parent not found with ID: non-existent-uuid',
      );
    });

    it('should throw NotFoundException if parent is soft deleted', async () => {
      const deletedParent = {
        ...mockParent,
        deleted_at: new Date(),
      } as Parent;

      parentModelAction.get.mockResolvedValue(deletedParent);

      await expect(service.update(mockParentId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Parent not found with ID: ${mockParentId}`,
      );
    });

    it('should throw ConflictException if email already exists for another user', async () => {
      const updateWithEmail = {
        ...updateDto,
        email: 'newemail@example.com',
      };

      const existingUser = {
        id: 'different-user-id', // Different from mockUser.id which is 'user-uuid-123'
        email: 'newemail@example.com',
      };

      // Reset the mock chain - first call is for email check, should return existing user
      userModelAction.get.mockReset();
      userModelAction.get.mockResolvedValue(existingUser as User);

      await expect(
        service.update(mockParentId, updateWithEmail),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.update(mockParentId, updateWithEmail),
      ).rejects.toThrow('User with email newemail@example.com already exists.');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Attempt to update parent email to existing email: newemail@example.com',
      );
      expect(userModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { email: 'newemail@example.com' },
      });
    });

    it('should allow updating email if new email does not exist', async () => {
      const updateWithEmail = {
        ...updateDto,
        email: 'newemail@example.com',
      };

      // Override default mock: no existing user with this email
      userModelAction.get.mockResolvedValueOnce(null);
      userModelAction.update.mockResolvedValue({
        ...mockUser,
        email: 'newemail@example.com',
      } as User);

      const result = await service.update(mockParentId, updateWithEmail);

      expect(result).toBeDefined();
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(userModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { email: 'newemail@example.com' },
      });
      expect(userModelAction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            email: 'newemail@example.com',
          }),
        }),
      );
    });

    it('should allow updating email if email is same as current', async () => {
      const updateWithSameEmail = {
        ...updateDto,
        email: mockUser.email,
      };

      const result = await service.update(mockParentId, updateWithSameEmail);

      expect(result).toBeDefined();
      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('should validate photo URL when updating', async () => {
      const updateWithPhoto = {
        ...updateDto,
        photo_url: 'https://example.com/photos/new-parent123.jpg',
      };

      await service.update(mockParentId, updateWithPhoto);

      expect(fileService.validatePhotoUrl).toHaveBeenCalledWith(
        'https://example.com/photos/new-parent123.jpg',
      );
    });

    it('should allow setting photo_url to null when updating', async () => {
      const updateWithNullPhoto = {
        ...updateDto,
        photo_url: null,
      };

      await service.update(mockParentId, updateWithNullPhoto);

      // Should not throw and should complete successfully
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(parentModelAction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            photo_url: null,
          }),
        }),
      );
    });

    it('should update user fields correctly including email', async () => {
      const updateWithUserFields: UpdateParentDto = {
        first_name: 'Jane',
        last_name: 'Smith',
        middle_name: 'Marie',
        email: 'jane.smith@example.com',
        phone: '+234 999 888 7777',
        gender: 'Female',
        date_of_birth: '1990-01-01',
        home_address: '456 New Street',
        is_active: false,
      };

      const updatedUser = {
        ...mockUser,
        first_name: 'Jane',
        last_name: 'Smith',
        middle_name: 'Marie',
        email: 'jane.smith@example.com',
        phone: '+234 999 888 7777',
        gender: 'Female',
        dob: new Date('1990-01-01'),
        homeAddress: '456 New Street',
        is_active: false,
      };

      // Override default mock: no email conflict
      userModelAction.get.mockResolvedValueOnce(null);
      userModelAction.update.mockResolvedValue(updatedUser as User);

      await service.update(mockParentId, updateWithUserFields);

      expect(userModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { email: 'jane.smith@example.com' },
      });
      expect(userModelAction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          identifierOptions: { id: mockUser.id },
          updatePayload: expect.objectContaining({
            first_name: 'Jane',
            last_name: 'Smith',
            middle_name: 'Marie',
            email: 'jane.smith@example.com',
            phone: '+234 999 888 7777',
            gender: 'Female',
            dob: expect.any(Date),
            homeAddress: '456 New Street',
            is_active: false,
          }),
        }),
      );
    });

    it('should update parent fields correctly', async () => {
      const updateWithParentFields: UpdateParentDto = {
        is_active: false,
        photo_url: 'https://example.com/new-photo.jpg',
      };

      await service.update(mockParentId, updateWithParentFields);

      expect(parentModelAction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          identifierOptions: { id: mockParentId },
          updatePayload: expect.objectContaining({
            is_active: false,
            photo_url: 'https://example.com/new-photo.jpg',
          }),
        }),
      );
    });

    it('should update both user and parent in a transaction', async () => {
      await service.update(mockParentId, updateDto);

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(userModelAction.update).toHaveBeenCalled();
      expect(parentModelAction.update).toHaveBeenCalled();
    });

    it('should log successful update', async () => {
      await service.update(mockParentId, updateDto);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String), // system message
        expect.objectContaining({
          parentId: mockParentId,
          email: mockUser.email,
        }),
      );
    });

    it('should handle partial updates (only some fields)', async () => {
      const partialUpdate: UpdateParentDto = {
        first_name: 'Partial',
      };

      await service.update(mockParentId, partialUpdate);

      expect(userModelAction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            first_name: 'Partial',
          }),
        }),
      );
      // Other fields should not be in the update payload
      const updateCall = userModelAction.update.mock.calls[0][0];
      expect(updateCall.updatePayload).not.toHaveProperty('last_name');
    });

    it('should convert date_of_birth string to Date object', async () => {
      const updateWithDate: UpdateParentDto = {
        date_of_birth: '1990-01-15',
      };

      await service.update(mockParentId, updateWithDate);

      expect(userModelAction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            dob: expect.any(Date),
          }),
        }),
      );
      const updateCall = userModelAction.update.mock.calls[0][0];
      const dob = updateCall.updatePayload.dob as Date;
      expect(dob.toISOString()).toContain('1990-01-15');
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      parentModelAction.get.mockResolvedValue(mockParent as Parent);
      parentModelAction.update.mockResolvedValue(mockParent as Parent);
      userModelAction.update.mockResolvedValue(mockUser as User);
    });

    it('should soft delete a parent successfully', async () => {
      await service.remove(mockParentId);

      expect(parentModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: mockParentId },
        relations: { user: true },
      });
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(parentModelAction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          identifierOptions: { id: mockParentId },
          updatePayload: expect.objectContaining({
            deleted_at: expect.any(Date),
            is_active: false,
          }),
        }),
      );
    });

    it('should deactivate associated user account', async () => {
      await service.remove(mockParentId);

      expect(userModelAction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          identifierOptions: { id: mockParent.user_id },
          updatePayload: {
            is_active: false,
          },
        }),
      );
    });

    it('should throw NotFoundException if parent not found', async () => {
      parentModelAction.get.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Parent not found with ID: non-existent-id',
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if parent is already soft deleted', async () => {
      const deletedParent = {
        ...mockParent,
        deleted_at: new Date(),
      } as Parent;

      parentModelAction.get.mockResolvedValue(deletedParent);

      await expect(service.remove(mockParentId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Parent not found with ID: ${mockParentId}`,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should execute parent and user updates in a transaction', async () => {
      await service.remove(mockParentId);

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(parentModelAction.update).toHaveBeenCalled();
      expect(userModelAction.update).toHaveBeenCalled();
    });

    it('should log successful deletion', async () => {
      await service.remove(mockParentId);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String), // system message
        expect.objectContaining({
          parentId: mockParentId,
          userId: mockParent.user_id,
        }),
      );
    });
  });

  describe('linkStudentsToParent', () => {
    const mockParentId = 'parent-uuid-123';
    const mockStudentId1 = 'student-uuid-001';
    const mockStudentId2 = 'student-uuid-002';

    const mockStudent1: Partial<Student> = {
      id: mockStudentId1,
      registration_number: 'STU-2025-0001',
      is_deleted: false,
    };

    const mockStudent2: Partial<Student> = {
      id: mockStudentId2,
      registration_number: 'STU-2025-0002',
      is_deleted: false,
    };

    const linkDto: LinkStudentsDto = {
      student_ids: [mockStudentId1, mockStudentId2],
    };

    beforeEach(() => {
      parentModelAction.get.mockResolvedValue(mockParent as Parent);
      studentModelAction.get.mockImplementation(async (options) => {
        const id = options.identifierOptions?.id;
        if (id === mockStudentId1) return mockStudent1 as Student;
        if (id === mockStudentId2) return mockStudent2 as Student;
        return null;
      });
      studentModelAction.update.mockResolvedValue({} as Student);
    });

    it('should link multiple students to parent successfully', async () => {
      const result = await service.linkStudentsToParent(mockParentId, linkDto);

      expect(result).toBeDefined();
      expect(result.parent_id).toBe(mockParentId);
      expect(result.linked_students).toEqual([mockStudentId1, mockStudentId2]);
      expect(result.total_linked).toBe(2);
      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('should validate parent exists', async () => {
      parentModelAction.get.mockResolvedValue(mockParent as Parent);

      await service.linkStudentsToParent(mockParentId, linkDto);

      expect(parentModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: mockParentId },
      });
    });

    it('should throw NotFoundException if parent not found', async () => {
      parentModelAction.get.mockResolvedValue(null);

      await expect(
        service.linkStudentsToParent(mockParentId, linkDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.linkStudentsToParent(mockParentId, linkDto),
      ).rejects.toThrow('Parent not found');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Parent not found with ID: ${mockParentId}`,
      );
    });

    it('should throw NotFoundException if parent is deleted', async () => {
      const deletedParent = {
        ...mockParent,
        deleted_at: new Date(),
      } as Parent;

      parentModelAction.get.mockResolvedValue(deletedParent);

      await expect(
        service.linkStudentsToParent(mockParentId, linkDto),
      ).rejects.toThrow(NotFoundException);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Parent not found with ID: ${mockParentId}`,
      );
    });

    it('should validate all students exist', async () => {
      await service.linkStudentsToParent(mockParentId, linkDto);

      expect(studentModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: mockStudentId1 },
      });
      expect(studentModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: mockStudentId2 },
      });
    });

    it('should throw NotFoundException if any student not found', async () => {
      studentModelAction.get.mockImplementation(async (options) => {
        const id = options.identifierOptions?.id;
        if (id === mockStudentId1) return mockStudent1 as Student;
        return null; // Second student not found
      });

      await expect(
        service.linkStudentsToParent(mockParentId, linkDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.linkStudentsToParent(mockParentId, linkDto),
      ).rejects.toThrow(`Student with ID ${mockStudentId2} not found`);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Student not found with ID: ${mockStudentId2}`,
      );
    });

    it('should throw NotFoundException if student is deleted', async () => {
      const deletedStudent = {
        ...mockStudent1,
        is_deleted: true,
      } as Student;

      studentModelAction.get.mockImplementation(async (options) => {
        const id = options.identifierOptions?.id;
        if (id === mockStudentId1) return deletedStudent;
        if (id === mockStudentId2) return mockStudent2 as Student;
        return null;
      });

      await expect(
        service.linkStudentsToParent(mockParentId, linkDto),
      ).rejects.toThrow(NotFoundException);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Student not found with ID: ${mockStudentId1}`,
      );
    });

    it('should update students with parent_id in a transaction', async () => {
      await service.linkStudentsToParent(mockParentId, linkDto);

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(studentModelAction.update).toHaveBeenCalledTimes(2);
      expect(studentModelAction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          identifierOptions: { id: mockStudentId1 },
          updatePayload: {
            parent: { id: mockParentId },
          },
          transactionOptions: {
            useTransaction: true,
            transaction: expect.anything(),
          },
        }),
      );
      expect(studentModelAction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          identifierOptions: { id: mockStudentId2 },
          updatePayload: {
            parent: { id: mockParentId },
          },
          transactionOptions: {
            useTransaction: true,
            transaction: expect.anything(),
          },
        }),
      );
    });

    it('should log successful linking', async () => {
      await service.linkStudentsToParent(mockParentId, linkDto);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Students successfully linked to parent',
        {
          parentId: mockParentId,
          studentIds: [mockStudentId1, mockStudentId2],
          totalLinked: 2,
        },
      );
    });

    it('should handle single student linking', async () => {
      const singleStudentDto: LinkStudentsDto = {
        student_ids: [mockStudentId1],
      };

      const result = await service.linkStudentsToParent(
        mockParentId,
        singleStudentDto,
      );

      expect(result.total_linked).toBe(1);
      expect(result.linked_students).toEqual([mockStudentId1]);
      expect(studentModelAction.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('getLinkedStudents', () => {
    const mockParentId = 'parent-uuid-123';
    const mockStudentId1 = 'student-uuid-001';
    const mockStudentId2 = 'student-uuid-002';

    const mockUser1: Partial<User> = {
      id: 'user-uuid-001',
      first_name: 'Alice',
      last_name: 'Smith',
      middle_name: 'Jane',
    };

    const mockUser2: Partial<User> = {
      id: 'user-uuid-002',
      first_name: 'Bob',
      last_name: 'Johnson',
    };

    const mockStudent1: Partial<Student> = {
      id: mockStudentId1,
      registration_number: 'STU-2025-0001',
      photo_url: 'https://example.com/student1.jpg',
      is_deleted: false,
      user: mockUser1 as User,
    };

    const mockStudent2: Partial<Student> = {
      id: mockStudentId2,
      registration_number: 'STU-2025-0002',
      photo_url: null,
      is_deleted: false,
      user: mockUser2 as User,
    };

    beforeEach(() => {
      parentModelAction.get.mockResolvedValue(mockParent as Parent);
      studentModelAction.list.mockResolvedValue({
        payload: [mockStudent1 as Student, mockStudent2 as Student],
        paginationMeta: null,
      });
    });

    it('should return linked students successfully', async () => {
      const result = await service.getLinkedStudents(mockParentId);

      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(mockStudentId1);
      expect(result[0].first_name).toBe('Alice');
      expect(result[0].last_name).toBe('Smith');
      expect(result[0].middle_name).toBe('Jane');
      expect(result[0].full_name).toBe('Alice Jane Smith');
      expect(result[1].id).toBe(mockStudentId2);
      expect(result[1].full_name).toBe('Bob Johnson');
    });

    it('should validate parent exists', async () => {
      await service.getLinkedStudents(mockParentId);

      expect(parentModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: mockParentId },
      });
    });

    it('should throw NotFoundException if parent not found', async () => {
      parentModelAction.get.mockResolvedValue(null);

      await expect(service.getLinkedStudents(mockParentId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getLinkedStudents(mockParentId)).rejects.toThrow(
        'Parent not found',
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Parent not found with ID: ${mockParentId}`,
      );
    });

    it('should throw NotFoundException if parent is deleted', async () => {
      const deletedParent = {
        ...mockParent,
        deleted_at: new Date(),
      } as Parent;

      parentModelAction.get.mockResolvedValue(deletedParent);

      await expect(service.getLinkedStudents(mockParentId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Parent not found with ID: ${mockParentId}`,
      );
    });

    it('should query students with correct filters', async () => {
      await service.getLinkedStudents(mockParentId);

      expect(studentModelAction.list).toHaveBeenCalledWith({
        filterRecordOptions: {
          parent: { id: mockParentId },
          is_deleted: false,
        },
        relations: {
          user: true,
        },
      });
    });

    it('should return empty array if no students linked', async () => {
      studentModelAction.list.mockResolvedValue({
        payload: [],
        paginationMeta: null,
      });

      const result = await service.getLinkedStudents(mockParentId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should log successful fetch', async () => {
      await service.getLinkedStudents(mockParentId);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Parent students fetched successfully',
        {
          parentId: mockParentId,
          studentCount: 2,
        },
      );
    });

    it('should transform students to StudentBasicDto correctly', async () => {
      const result = await service.getLinkedStudents(mockParentId);

      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('registration_number');
      expect(result[0]).toHaveProperty('first_name');
      expect(result[0]).toHaveProperty('last_name');
      expect(result[0]).toHaveProperty('middle_name');
      expect(result[0]).toHaveProperty('full_name');
      expect(result[0]).toHaveProperty('photo_url');
    });

    it('should handle students without middle names', async () => {
      const result = await service.getLinkedStudents(mockParentId);

      expect(result[1].middle_name).toBeUndefined();
      expect(result[1].full_name).toBe('Bob Johnson');
    });

    it('should handle students without photo URLs', async () => {
      const result = await service.getLinkedStudents(mockParentId);

      expect(result[1].photo_url).toBeNull();
    });
  });

  describe('getStudentSubjects', () => {
    const mockStudentId = 'student-uuid-123';
    const mockClassId = 'class-uuid-123';

    it('should return subjects for admin user', async () => {
      const adminUser: IUserPayload = {
        ...mockUserPayload,
        roles: [UserRole.ADMIN],
      };

      classStudentModelAction.get.mockResolvedValue({
        class: { id: mockClassId },
      } as unknown as ClassStudent);

      (
        classSubjectModelAction as unknown as MockModelAction
      ).repository.find.mockResolvedValue([
        {
          subject: { name: 'Math' },
          teacher: {
            user: {
              first_name: 'Teacher',
              last_name: 'One',
              email: 't1@test.com',
            },
          },
        },
      ] as unknown as ClassSubject[]);

      const result = await service.getStudentSubjects(mockStudentId, adminUser);

      expect(result).toHaveLength(1);
      expect(result[0].subject_name).toBe('Math');
      expect(classStudentModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { student: { id: mockStudentId }, is_active: true },
        relations: { class: true },
      });
    });

    it('should return subjects for parent user linked to student', async () => {
      parentModelAction.get.mockResolvedValue({ id: mockParentId } as Parent);
      studentModelAction.get.mockResolvedValue({
        id: mockStudentId,
      } as Student);

      classStudentModelAction.get.mockResolvedValue({
        class: { id: mockClassId },
      } as unknown as ClassStudent);

      (
        classSubjectModelAction as unknown as MockModelAction
      ).repository.find.mockResolvedValue([
        {
          subject: { name: 'English' },
          teacher: {
            user: {
              first_name: 'Teacher',
              last_name: 'Two',
              email: 't2@test.com',
            },
          },
        },
      ] as unknown as ClassSubject[]);

      const result = await service.getStudentSubjects(
        mockStudentId,
        mockUserPayload,
      );

      expect(result).toHaveLength(1);
      expect(result[0].subject_name).toBe('English');
      expect(parentModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { user_id: mockUserPayload.id },
      });
      expect(studentModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: mockStudentId, parent: { id: mockParentId } },
      });
    });

    it('should throw NotFoundException if parent profile not found', async () => {
      parentModelAction.get.mockResolvedValue(null);

      await expect(
        service.getStudentSubjects(mockStudentId, mockUserPayload),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if student not linked to parent', async () => {
      parentModelAction.get.mockResolvedValue({ id: mockParentId } as Parent);
      studentModelAction.get.mockResolvedValue(null);

      await expect(
        service.getStudentSubjects(mockStudentId, mockUserPayload),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return empty array if student has no active class', async () => {
      parentModelAction.get.mockResolvedValue({ id: mockParentId } as Parent);
      studentModelAction.get.mockResolvedValue({
        id: mockStudentId,
      } as Student);
      classStudentModelAction.get.mockResolvedValue(null);

      const result = await service.getStudentSubjects(
        mockStudentId,
        mockUserPayload,
      );

      expect(result).toEqual([]);
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });
});
