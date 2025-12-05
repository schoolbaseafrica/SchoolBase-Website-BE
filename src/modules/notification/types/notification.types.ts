import { FeeNotificationType } from '../../shared/enums';

export enum NotificationType {
  ACADEMIC_UPDATE = 'ACADEMIC_UPDATE',
  RESULT_ALERT = 'RESULT_ALERT',
  TIMETABLE_CHANGE = 'TIMETABLE_CHANGE',
  FEE_UPDATE = 'FEE_UPDATE',
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

export interface IFeeMetadata {
  transaction_id: string;
  amount: string;
  currency: string;
  description: string;
  status: 'paid' | 'pending' | 'overdue';
}

export interface IFeeNotificaionMetadata {
  fee_id: string;
  type: FeeNotificationType;
  student_id: string;
  fee_name: string;
  amount: number;
}

export type NotificationMetadata =
  | IResultMetadata
  | ITimetableMetadata
  | ISubjectMetadata
  | IFeeMetadata
  | IFeeNotificaionMetadata
  | Record<string, unknown>;
