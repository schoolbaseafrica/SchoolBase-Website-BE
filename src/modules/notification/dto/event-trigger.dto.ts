import { IsUUID, IsString, IsEnum, IsNotEmpty } from 'class-validator';

export enum EventAction {
  CREATED = 'created',
  UPDATED = 'updated',
}

export class SubjectEventDto {
  @IsUUID()
  @IsNotEmpty()
  subject_id: string;

  @IsString()
  @IsNotEmpty()
  subject_name: string;

  @IsEnum(EventAction)
  action: EventAction;

  @IsUUID()
  @IsNotEmpty()
  class_id: string;
}

export class TimetableEventDto {
  @IsUUID()
  @IsNotEmpty()
  timetable_id: string;

  @IsEnum(EventAction)
  action: EventAction;

  @IsUUID()
  @IsNotEmpty()
  class_id: string;

  @IsString()
  @IsNotEmpty()
  day_of_week: string;

  @IsString()
  @IsNotEmpty()
  start_time: string;
}

export class ResultEventDto {
  @IsUUID()
  @IsNotEmpty()
  result_id: string;

  @IsUUID()
  @IsNotEmpty()
  student_id: string;

  @IsUUID()
  @IsNotEmpty()
  subject_id: string;

  @IsString()
  @IsNotEmpty()
  score: string;
}

export class FeeEventDto {
  @IsUUID()
  @IsNotEmpty()
  transaction_id: string;

  @IsUUID()
  @IsNotEmpty()
  student_id: string;

  @IsString()
  @IsNotEmpty()
  amount: string;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
