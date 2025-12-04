import { Entity, Column, Index } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';

export enum NotificationType {
  ACADEMIC_UPDATE = 'ACADEMIC_UPDATE',
  RESULT_ALERT = 'RESULT_ALERT',
  TIMETABLE_CHANGE = 'TIMETABLE_CHANGE',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

export interface IResultMetadata {
  result_id: string;
  student_id: string;
  subject_id: string;
  deep_link?: string;
}

export interface ITimetableMetadata {
  timetable_id: string;
  class_id: string;
  room_number?: string;
}

export interface ISubjectMetadata {
  subject_id: string;
  action: 'created' | 'updated';
}

export type NotificationMetadata =
  | IResultMetadata
  | ITimetableMetadata
  | ISubjectMetadata
  | Record<string, unknown>;

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
