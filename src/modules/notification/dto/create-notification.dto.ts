import {
  IsUUID,
  IsString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

import {
  NotificationMetadata,
  NotificationType,
} from '../types/notification.types';

export class CreateNotificationDto {
  @IsUUID()
  @IsNotEmpty()
  recipient_id: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsOptional()
  metadata?: NotificationMetadata;
}
