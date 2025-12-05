import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import * as sysMsg from '../../../constants/system.messages';
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

    // Transform to response DTOs
    const notifications = plainToInstance(NotificationResponseDto, payload, {
      excludeExtraneousValues: true,
    });

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
}
