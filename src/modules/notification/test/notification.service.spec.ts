import { Test, TestingModule } from '@nestjs/testing';

import { NotificationModelAction } from '../model-actions/notification.model-action';
import { NotificationService } from '../services/notification.service';
import { NotificationType } from '../types/notification.types';

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationModelAction: NotificationModelAction;

  const mockNotificationModelAction = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: NotificationModelAction,
          useValue: mockNotificationModelAction,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    notificationModelAction = module.get<NotificationModelAction>(
      NotificationModelAction,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const userId = 'user-123';
      const title = 'Test Notification';
      const message = 'This is a test message';
      const type = NotificationType.SYSTEM_ALERT;
      const metadata = { key: 'value' };

      const expectedPayload = {
        createPayload: {
          recipient_id: userId,
          title,
          message,
          type,
          metadata,
          is_read: false,
        },
        transactionOptions: { useTransaction: false },
      };

      mockNotificationModelAction.create.mockResolvedValue(
        'created-notification',
      );

      const result = await service.createNotification(
        userId,
        title,
        message,
        type,
        metadata,
      );

      expect(notificationModelAction.create).toHaveBeenCalledWith(
        expectedPayload,
      );
      expect(result).toBe('created-notification');
    });
  });
});
