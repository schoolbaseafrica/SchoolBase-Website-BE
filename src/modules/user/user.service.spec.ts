import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { ApiSuccessResponseDto } from '../../common/dto/response.dto';
import { UserNotFoundException } from '../../common/exceptions/domain.exceptions';
import * as sysMsg from '../../constants/system.messages';

import { User } from './entities/user.entity';
import { UserModelAction } from './model-actions/user-actions';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let userModelAction: jest.Mocked<UserModelAction>;

  const mockDataSource = {
    transaction: jest.fn(),
  };

  const mockUserModelAction = {
    get: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserModelAction,
          useValue: mockUserModelAction,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userModelAction = module.get(UserModelAction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a user when found', async () => {
      const fakeUser = {
        id: '123',
        email: 'test@example.com',
      } as unknown as User;

      userModelAction.get.mockResolvedValue(fakeUser);

      const result = await service.findOne('123');

      expect(userModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: '123' },
      });

      expect(result).toEqual(fakeUser);
    });

    it('should return null when user is not found', async () => {
      userModelAction.get.mockResolvedValue(null);

      const result = await service.findOne('invalid-id');

      expect(userModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: 'invalid-id' },
      });

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should call userModelAction.update with default transactionOptions', async () => {
      type UpdateArgs = Parameters<typeof userModelAction.update>[0];

      const payload: UpdateArgs['updatePayload'] = {
        email: 'updated@example.com',
      };

      const identifierOptions: UpdateArgs['identifierOptions'] = {
        id: '123',
      };

      const updatedUser = {
        id: '123',
        email: 'updated@example.com',
      } as unknown as User;

      userModelAction.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser(payload, identifierOptions);

      expect(userModelAction.update).toHaveBeenCalledWith({
        updatePayload: payload,
        identifierOptions,
        transactionOptions: { useTransaction: false },
      });

      expect(result).toEqual(updatedUser);
    });
  });

  describe('remove', () => {
    it('should remove a user and return a success response', async () => {
      const fakeUser = {
        id: '123',
        email: 'test',
      } as unknown as User;

      userModelAction.get.mockResolvedValue(fakeUser);
      userModelAction.delete.mockResolvedValue(undefined);

      const result = await service.remove('123');
      expect(userModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: '123' },
      });

      expect(userModelAction.update).toHaveBeenCalledWith({
        identifierOptions: { id: '123' },
        updatePayload: { deleted_at: expect.any(Date) },
        transactionOptions: { useTransaction: false },
      });

      expect(result).toBeInstanceOf(ApiSuccessResponseDto);
      expect(result.message).toBe(sysMsg.ACCOUNT_DELETED);
    });

    it('should throw UserNotFoundException when user does not exist', async () => {
      userModelAction.get.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        UserNotFoundException,
      );

      expect(userModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: 'invalid-id' },
      });

      expect(userModelAction.delete).not.toHaveBeenCalled();
    });
  });
});
