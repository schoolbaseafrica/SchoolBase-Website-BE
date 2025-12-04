import { Injectable } from '@nestjs/common';

import {
  NotificationType,
  NotificationMetadata,
} from './entities/notification.entity';
import { NotificationModelAction } from './model-actions/notification.model-action';

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
}
