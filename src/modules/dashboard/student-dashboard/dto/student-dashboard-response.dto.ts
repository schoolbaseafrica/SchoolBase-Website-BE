import { ApiProperty } from '@nestjs/swagger';

export class TimetableItemDto {
  @ApiProperty({ example: 'uuid-123' })
  id: string;

  @ApiProperty({ example: 'Mathematics' })
  subject_name: string;

  @ApiProperty({ example: 'Mr. John Doe', nullable: true })
  teacher_name: string | null;

  @ApiProperty({ example: 'Room 101', nullable: true })
  room: string | null;

  @ApiProperty({ example: '08:00:00' })
  start_time: string;

  @ApiProperty({ example: '09:30:00' })
  end_time: string;

  @ApiProperty({ example: 'ACADEMICS' })
  period_type: string;
}

export class LatestResultDto {
  @ApiProperty({ example: 'uuid-456' })
  id: string;

  @ApiProperty({ example: 'Mathematics' })
  subject_name: string;

  @ApiProperty({ example: 85 })
  score: number;

  @ApiProperty({ example: 'A' })
  grade: string;

  @ApiProperty({ example: 'Excellent performance' })
  remark: string;

  @ApiProperty({ example: 'Fall 2024' })
  term: string;

  @ApiProperty({ example: '2024-11-20T10:30:00Z' })
  recorded_at: Date;
}

export class AnnouncementDto {
  @ApiProperty({ example: 'uuid-789' })
  id: string;

  @ApiProperty({ example: 'Holiday Notice' })
  title: string;

  @ApiProperty({ example: 'School will be closed on...' })
  content: string;

  @ApiProperty({ example: 'high' })
  priority: string;

  @ApiProperty({ example: '2024-11-20T08:00:00Z' })
  published_at: Date;

  @ApiProperty({ example: '2024-12-31T23:59:59Z', nullable: true })
  expires_at: Date | null;
}

export class StudentDashboardDataDto {
  @ApiProperty({
    type: [TimetableItemDto],
    description: "Today's timetable for the student",
  })
  todays_timetable: TimetableItemDto[];

  @ApiProperty({
    type: [LatestResultDto],
    description: 'Latest 5 results across all subjects',
  })
  latest_results: LatestResultDto[];

  @ApiProperty({
    type: [AnnouncementDto],
    description: 'Recent announcements for students',
  })
  announcements: AnnouncementDto[];

  @ApiProperty({
    example: {
      class: 'Grade 10A',
      enrollment_status: 'Active',
      total_subjects: 8,
    },
    description: 'Student metadata',
  })
  metadata: {
    class: string;
    enrollment_status: string;
    total_subjects: number;
  };
}

export class StudentDashboardResponseDto {
  @ApiProperty({ example: 200 })
  status_code: number;

  @ApiProperty({ example: 'Student dashboard loaded successfully' })
  message: string;

  @ApiProperty({ type: StudentDashboardDataDto })
  data: StudentDashboardDataDto;
}
