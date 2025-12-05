import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import * as sysMsg from '../../../constants/system.messages';
import { UserNotificationByIdResponseDto } from '../dto/user-notification-by-id-response.dto';
import { ListNotificationsQueryDto } from '../dto/user-notification-list-query.dto';
import {
  NotificationResponseDto,
  PaginatedNotificationsResponseDto,
  PaginationMetaDto,
} from '../dto/user-notification-response.dto';
import { NotificationModelAction } from '../model-actions/notification.model-action';
import {
  NotificationType,
  NotificationMetadata,
} from '../types/notification.types';

/**
 * Calculate pagination metadata
 */
function calculatePaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMetaDto {
  const total_pages = Math.ceil(total / limit);
  const has_next = page < total_pages;
  const has_previous = page > 1;

  return {
    total,
    page,
    limit,
    total_pages,
    has_next,
    has_previous,
  };
}

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationModelAction: NotificationModelAction,
  ) {}

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    metadata?: NotificationMetadata,
  ) {
    return this.notificationModelAction.create({
      createPayload: {
        recipient_id: userId,
        title,
        message,
        type,
        metadata,
        is_read: false,
      },
      transactionOptions: { useTransaction: false },
    });
  }

  async getUserNotifications(
    userId: string,
    query: ListNotificationsQueryDto,
  ): Promise<PaginatedNotificationsResponseDto> {
    const { page = 1, limit = 20, is_read } = query;

    // Build filter options
    const filterOptions: Record<string, unknown> = {
      recipient_id: userId,
    };

    // Add is_read filter only if explicitly provided
    if (is_read !== undefined) {
      filterOptions.is_read = is_read;
    }

    // Fetch notifications with pagination
    const { payload, paginationMeta } = await this.notificationModelAction.list(
      {
        filterRecordOptions: filterOptions,
        order: { createdAt: 'DESC' },
        paginationPayload: { page, limit },
      },
    );

    // Map notifications to include snake_case timestamps
    const mappedPayload = payload.map((notification) => ({
      ...notification,
      created_at: notification.createdAt,
      updated_at: notification.updatedAt,
    }));

    // Transform to response DTOs
    const notifications = plainToInstance(
      NotificationResponseDto,
      mappedPayload,
      {
        excludeExtraneousValues: true,
      },
    );

    // Calculate pagination metadata
    const total = paginationMeta?.total ?? 0;
    const pagination = calculatePaginationMeta(total, page, limit);

    return {
      message: sysMsg.NOTIFICATIONS_RETRIEVED,
      data: {
        notifications,
      },
      pagination,
    };
  }

  async getNotificationById(
    notificationId: string,
    userId: string,
  ): Promise<{ message: string; data: UserNotificationByIdResponseDto }> {
    // Fetch the notification by ID
    const notification = await this.notificationModelAction.get({
      identifierOptions: { id: notificationId },
    });

    // Check if notification exists
    if (!notification) {
      throw new NotFoundException(sysMsg.NOTIFICATION_NOT_FOUND);
    }

    // Verify user authorization - user can only access their own notifications
    if (notification.recipient_id !== userId) {
      throw new ForbiddenException(sysMsg.UNAUTHORIZED_NOTIFICATION_ACCESS);
    }

    // Map notification to include snake_case timestamps
    const mappedNotification = {
      ...notification,
      created_at: notification.createdAt,
      updated_at: notification.updatedAt,
    };

    // Transform to response DTO
    const notificationDto = plainToInstance(
      UserNotificationByIdResponseDto,
      mappedNotification,
      {
        excludeExtraneousValues: true,
      },
    );

    return {
      message: sysMsg.NOTIFICATION_RETRIEVED,
      data: notificationDto,
    };
  }
}
