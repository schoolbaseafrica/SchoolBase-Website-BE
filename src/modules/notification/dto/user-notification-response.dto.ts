import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { NotificationType } from '../types/notification.types';

export class NotificationResponseDto {
  @ApiProperty({
    description: 'Notification ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'ID of the user who will receive this notification',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @Expose()
  recipient_id: string;

  @ApiProperty({
    enum: NotificationType,
    description: 'Type of notification',
    example: NotificationType.SYSTEM_ALERT,
  })
  @Expose()
  type: NotificationType;

  @ApiProperty({
    description: 'Title of the notification',
    example: 'New Assignment Posted',
  })
  @Expose()
  title: string;

  @ApiProperty({
    description: 'Main message content of the notification',
    example: 'A new assignment has been posted for Mathematics',
  })
  @Expose()
  message: string;

  @ApiProperty({
    description: 'Whether the notification has been read',
    example: false,
  })
  @Expose()
  is_read: boolean;

  @ApiPropertyOptional({
    description: 'Additional metadata for the notification',
    example: { assignment_id: '123', subject: 'Mathematics' },
  })
  @Expose()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'URL or route to navigate when notification is clicked',
    example: '/assignments/123',
  })
  @Expose()
  action_url?: string;

  @ApiProperty({
    description: 'Timestamp when the notification was created',
    example: '2025-12-04T23:30:00.000Z',
  })
  @Expose()
  created_at: Date;

  @ApiProperty({
    description: 'Timestamp when the notification was last updated',
    example: '2025-12-04T23:30:00.000Z',
  })
  @Expose()
  updated_at: Date;
}

export class PaginationMetaDto {
  @ApiProperty({ description: 'Total number of notifications' })
  @Expose()
  total: number;

  @ApiProperty({ description: 'Current page number' })
  @Expose()
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  @Expose()
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  @Expose()
  total_pages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  @Expose()
  has_next: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  @Expose()
  has_previous: boolean;
}

export class NotificationDataDto {
  @ApiProperty({ type: [NotificationResponseDto] })
  @Expose()
  @Type(() => NotificationResponseDto)
  notifications: NotificationResponseDto[];
}

export class PaginatedNotificationsResponseDto {
  @ApiProperty()
  @Expose()
  message: string;

  @ApiProperty({ type: NotificationDataDto })
  @Expose()
  @Type(() => NotificationDataDto)
  data: NotificationDataDto;

  @ApiProperty({ type: PaginationMetaDto })
  @Expose()
  @Type(() => PaginationMetaDto)
  pagination: PaginationMetaDto;
}
