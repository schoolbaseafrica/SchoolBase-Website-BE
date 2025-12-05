import { Entity, Column, Index } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import {
  NotificationMetadata,
  NotificationType,
} from '../types/notification.types';
@Entity('notifications')
export class Notification extends BaseEntity {
  @Index()
  @Column()
  recipient_id: string;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.SYSTEM_ALERT,
  })
  type: NotificationType;

  @Column({ default: false })
  is_read: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: NotificationMetadata;
}
