import { ConflictException } from '@nestjs/common';
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

import { CreateParentDto } from './dto';
import { Parent } from './entities/parent.entity';
import { ParentModelAction } from './model-actions/parent-actions';
import { ParentService } from './parent.service';

// Mock the password utilities
jest.mock('../shared/utils/password.util', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed_password'),
  generateStrongPassword: jest.fn().mockReturnValue('GeneratedPass123'),
}));

describe('ParentService', () => {
  let service: ParentService;
  let parentRepository: jest.Mocked<Repository<Parent>>;
  let dataSource: jest.Mocked<DataSource>;
  let fileService: jest.Mocked<FileService>;
  let parentModelAction: jest.Mocked<ParentModelAction>;
  let userModelAction: jest.Mocked<UserModelAction>;
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

  const mockParentId = 'parent-uuid-123';
  const mockParent: Partial<Parent> = {
    id: mockParentId,
    user_id: 'user-uuid-123',
    photo_url: 'https://example.com/photos/parent123.jpg',
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
    parentRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
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
    } as unknown as jest.Mocked<ParentModelAction>;

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
      const dtoWithoutActive = { ...createDto };
      delete dtoWithoutActive.is_active;

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
      const dtoWithoutPassword = { ...createDto };
      delete dtoWithoutPassword.password;

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
});
