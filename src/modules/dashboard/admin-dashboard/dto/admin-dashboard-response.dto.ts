import { ApiProperty } from '@nestjs/swagger';

export class ActivityTeacherDto {
  @ApiProperty({ example: 'uuid-123' })
  id: string;

  @ApiProperty({ example: 'Mr.' })
  title: string;

  @ApiProperty({ example: 'John' })
  first_name: string;

  @ApiProperty({ example: 'Doe' })
  last_name: string;

  @ApiProperty({ example: 'Mr. John Doe' })
  full_name: string;
}

export class ActivitySubjectDto {
  @ApiProperty({ example: 'uuid-456' })
  id: string;

  @ApiProperty({ example: 'Mathematics' })
  name: string;
}

export class ActivityClassDto {
  @ApiProperty({ example: 'uuid-789' })
  id: string;

  @ApiProperty({ example: 'Form 1A' })
  name: string;
}

export class TodayActivityDto {
  @ApiProperty({ example: 'uuid-schedule-123' })
  schedule_id: string;

  @ApiProperty({ type: ActivityTeacherDto, nullable: true })
  teacher: ActivityTeacherDto | null;

  @ApiProperty({ type: ActivitySubjectDto, nullable: true })
  subject: ActivitySubjectDto | null;

  @ApiProperty({ type: ActivityClassDto })
  class: ActivityClassDto;

  @ApiProperty({ example: '08:00:00', description: 'Start time in HH:MM:SS' })
  start_time: string;

  @ApiProperty({ example: '09:30:00', description: 'End time in HH:MM:SS' })
  end_time: string;

  @ApiProperty({ example: 'Room 101', nullable: true })
  venue: string | null;

  @ApiProperty({ example: 'ACADEMICS', enum: ['ACADEMICS', 'BREAK'] })
  period_type: string;

  @ApiProperty({
    example: 'IN_PROGRESS',
    enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
    description: 'Progress status based on current time',
  })
  progress_status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

export class AdminDashboardDataDto {
  @ApiProperty({
    type: [TodayActivityDto],
    description: 'All academic activities scheduled for today',
  })
  todays_activities: TodayActivityDto[];

  @ApiProperty({
    example: {
      total_activities: 45,
      completed_activities: 12,
      in_progress_activities: 2,
      upcoming_activities: 31,
      activities_with_no_teacher: 3,
    },
    description: 'Summary statistics for today',
  })
  summary: {
    total_activities: number;
    completed_activities: number;
    in_progress_activities: number;
    upcoming_activities: number;
    activities_with_no_teacher: number;
  };
}

export class AdminDashboardResponseDto {
  @ApiProperty({ example: 200 })
  status_code: number;

  @ApiProperty({ example: "Today's activities loaded successfully" })
  message: string;

  @ApiProperty({ type: AdminDashboardDataDto })
  data: AdminDashboardDataDto;
}
