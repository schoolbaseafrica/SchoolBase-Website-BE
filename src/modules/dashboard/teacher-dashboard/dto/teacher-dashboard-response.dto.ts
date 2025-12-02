import { ApiProperty } from '@nestjs/swagger';

export class TodaysClassDto {
  @ApiProperty({ example: 'uuid-schedule-123' })
  schedule_id: string;

  @ApiProperty({ example: 'Form 1A' })
  class_name: string;

  @ApiProperty({ example: 'uuid-class-123' })
  class_id: string;

  @ApiProperty({ example: 'Mathematics' })
  subject_name: string;

  @ApiProperty({ example: 'uuid-subject-123' })
  subject_id: string;

  @ApiProperty({ example: '08:00:00', description: 'Start time in HH:MM:SS' })
  start_time: string;

  @ApiProperty({ example: '09:30:00', description: 'End time in HH:MM:SS' })
  end_time: string;

  @ApiProperty({ example: 'Room 101', nullable: true })
  room: string | null;
}

export class TodaysClassesResponseDto {
  @ApiProperty({
    type: [TodaysClassDto],
    description: 'Classes scheduled for the teacher today',
  })
  todays_classes: TodaysClassDto[];

  @ApiProperty({ example: 5, description: 'Total number of classes today' })
  total_classes: number;
}
