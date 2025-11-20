import { Test, TestingModule } from '@nestjs/testing';

import { ApiSuccessResponseDto } from '../../common/dto/response.dto';
import { UserNotFoundException } from '../../common/exceptions/domain.exceptions';
import * as sysMsg from '../../constants/system.messages';

import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserService', () => {
  let controller: UserController;
  let userService: UserService;

  const mockAuthService = {
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('remove', () => {
    it('should remove a user and return a success response', async () => {
      const userId = 'some-uuid';
      const successMessage = sysMsg.ACCOUNT_DELETED;

      mockAuthService.remove.mockResolvedValue(
        new ApiSuccessResponseDto(successMessage),
      );

      const result = await controller.remove(userId);

      expect(userService.remove).toHaveBeenCalledWith(userId);
      expect(result).toEqual(new ApiSuccessResponseDto(successMessage));
    });

    it('should return a UserNotFoundException if user is not found', async () => {
      const userId = 'some-uuid';

      mockAuthService.remove.mockRejectedValue(
        new UserNotFoundException(userId),
      );

      await expect(controller.remove(userId)).rejects.toThrow(
        new UserNotFoundException(userId),
      );
    });
  });
});
