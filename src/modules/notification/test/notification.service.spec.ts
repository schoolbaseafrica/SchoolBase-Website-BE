import { Test, TestingModule } from '@nestjs/testing';

import { ListNotificationsQueryDto } from '../dto/user-notification-list-query.dto';
import { NotificationModelAction } from '../model-actions/notification.model-action';
import { NotificationService } from '../services/notification.service';
import { NotificationType } from '../types/notification.types';

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationModelAction: jest.Mocked<NotificationModelAction>;

  const mockNotificationModelAction = {
    list: jest.fn(),
    create: jest.fn(),
  };

  const mockNotification = {
    id: 'notification-1',
    recipient_id: 'user-123',
    type: NotificationType.SYSTEM_ALERT,
    title: 'Test Notification',
    message: 'This is a test notification',
    is_read: false,
    metadata: {},
    createdAt: new Date('2025-12-04T00:00:00.000Z'),
    updatedAt: new Date('2025-12-04T00:00:00.000Z'),
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
    notificationModelAction = module.get(NotificationModelAction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserNotifications', () => {
    const userId = 'user-123';

    it('should return paginated notifications with correct structure', async () => {
      const query: ListNotificationsQueryDto = {
        page: 1,
        limit: 20,
      };

      mockNotificationModelAction.list.mockResolvedValue({
        payload: [mockNotification],
        paginationMeta: { total: 1 },
      });

      const result = await service.getUserNotifications(userId, query);

      expect(notificationModelAction.list).toHaveBeenCalledWith({
        filterRecordOptions: { recipient_id: userId },
        order: { createdAt: 'DESC' },
        paginationPayload: { page: 1, limit: 20 },
      });

      expect(result).toEqual({
        message: 'Notifications retrieved successfully',
        data: {
          notifications: [
            expect.objectContaining({
              id: 'notification-1',
              title: 'Test Notification',
              is_read: false,
            }),
          ],
        },
        pagination: {
          total: 1,
          page: 1,
          limit: 20,
          total_pages: 1,
          has_next: false,
          has_previous: false,
        },
      });
    });

    it('should filter by is_read status', async () => {
      const query: ListNotificationsQueryDto = {
        page: 1,
        limit: 20,
        is_read: false,
      };

      mockNotificationModelAction.list.mockResolvedValue({
        payload: [mockNotification],
        paginationMeta: { total: 1 },
      });

      await service.getUserNotifications(userId, query);

      expect(notificationModelAction.list).toHaveBeenCalledWith({
        filterRecordOptions: {
          recipient_id: userId,
          is_read: false,
        },
        order: { createdAt: 'DESC' },
        paginationPayload: { page: 1, limit: 20 },
      });
    });

    it('should return empty array when user has no notifications', async () => {
      const query: ListNotificationsQueryDto = {
        page: 1,
        limit: 20,
      };

      mockNotificationModelAction.list.mockResolvedValue({
        payload: [],
        paginationMeta: { total: 0 },
      });

      const result = await service.getUserNotifications(userId, query);

      expect(result.data.notifications).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should use default pagination values', async () => {
      const query: ListNotificationsQueryDto = {};

      mockNotificationModelAction.list.mockResolvedValue({
        payload: [],
        paginationMeta: { total: 0 },
      });

      await service.getUserNotifications(userId, query);

      expect(notificationModelAction.list).toHaveBeenCalledWith(
        expect.objectContaining({
          paginationPayload: { page: 1, limit: 20 },
        }),
      );
    });

    it('should calculate pagination metadata correctly', async () => {
      const query: ListNotificationsQueryDto = {
        page: 2,
        limit: 10,
      };

      mockNotificationModelAction.list.mockResolvedValue({
        payload: [mockNotification],
        paginationMeta: { total: 25 },
      });

      const result = await service.getUserNotifications(userId, query);

      expect(result.pagination).toEqual({
        total: 25,
        page: 2,
        limit: 10,
        total_pages: 3,
        has_next: true,
        has_previous: true,
      });
    });
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
