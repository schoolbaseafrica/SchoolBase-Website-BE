import { NotFoundException, ForbiddenException } from '@nestjs/common';
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
    get: jest.fn(),
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

  describe('getNotificationById', () => {
    const userId = 'user-123';
    const notificationId = 'notification-1';

    it('should return notification by ID when user is authorized', async () => {
      mockNotificationModelAction.get.mockResolvedValue(mockNotification);

      const result = await service.getNotificationById(notificationId, userId);

      expect(notificationModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: notificationId },
      });
      expect(result).toEqual({
        message: 'Notification retrieved successfully',
        data: expect.objectContaining({
          id: 'notification-1',
          recipient_id: 'user-123',
          title: 'Test Notification',
          is_read: false,
        }),
      });
    });

    it('should throw NotFoundException when notification not found', async () => {
      mockNotificationModelAction.get.mockResolvedValue(null);

      await expect(
        service.getNotificationById(notificationId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException when user tries to access another user's notification", async () => {
      const otherUserNotification = {
        ...mockNotification,
        recipient_id: 'other-user-456',
      };

      mockNotificationModelAction.get.mockResolvedValue(otherUserNotification);

      await expect(
        service.getNotificationById(notificationId, userId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should include all notification fields in response', async () => {
      const detailedNotification = {
        ...mockNotification,
        metadata: { action_url: '/test', entity_type: 'class' },
      };

      mockNotificationModelAction.get.mockResolvedValue(detailedNotification);

      const result = await service.getNotificationById(notificationId, userId);

      expect(result.data).toEqual(
        expect.objectContaining({
          id: 'notification-1',
          recipient_id: 'user-123',
          type: NotificationType.SYSTEM_ALERT,
          title: 'Test Notification',
          message: 'This is a test notification',
          is_read: false,
          metadata: { action_url: '/test', entity_type: 'class' },
        }),
      );
    });
  });
});
