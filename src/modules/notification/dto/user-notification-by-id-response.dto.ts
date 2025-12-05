import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import {
  NotificationMetadata,
  NotificationType,
} from '../types/notification.types';

export class UserNotificationByIdResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the notification',
    example: 'd4872d98-380c-4745-a4d9-d4c3161b92e0',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'User ID of the notification recipient',
    example: 'cfc4f412-73cb-4976-b204-67e240694e94',
  })
  @Expose()
  recipient_id: string;

  @ApiProperty({
    description: 'Type of notification',
    enum: NotificationType,
    example: NotificationType.SYSTEM_ALERT,
  })
  @Expose()
  type: NotificationType;

  @ApiProperty({
    description: 'Notification title',
    example: 'New Class Assignment',
  })
  @Expose()
  title: string;

  @ApiProperty({
    description: 'Notification message body',
    example: 'You have been assigned to Math 101.',
  })
  @Expose()
  message: string;

  @ApiProperty({
    description: 'Read status of the notification',
    example: false,
  })
  @Expose()
  is_read: boolean;

  @ApiProperty({
    description: 'Additional metadata associated with the notification',
    required: false,
    example: { action_url: '/classes/123', entity_type: 'class' },
  })
  @Expose()
  metadata?: NotificationMetadata;

  @ApiProperty({
    description: 'Date and time when the notification was created',
    example: '2024-12-05T10:30:00.000Z',
  })
  @Expose()
  created_at: Date;

  @ApiProperty({
    description: 'Date and time when the notification was last updated',
    example: '2024-12-05T10:30:00.000Z',
  })
  @Expose()
  updated_at: Date;
}
