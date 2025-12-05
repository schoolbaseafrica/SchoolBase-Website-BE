import { Test, TestingModule } from '@nestjs/testing';

import { NotificationController } from '../controller/notification.controller';
import { NotificationService } from '../services/notification.service';

describe('NotificationController', () => {
  let controller: NotificationController;

  const mockNotificationService = {
    getUserNotifications: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
