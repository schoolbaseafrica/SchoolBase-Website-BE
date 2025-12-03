import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class GetClassAttendanceQueryDto {
  @ApiProperty({
    description: 'Date to get attendance for (YYYY-MM-DD)',
    example: '2025-12-02',
  })
  @IsDateString()
  date: string;
}

export class ClassAttendanceSummaryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  student_id: string;

  @ApiProperty({ example: 'John' })
  first_name: string;

  @ApiProperty({ example: 'Michael', required: false })
  middle_name?: string;

  @ApiProperty({ example: 'Doe' })
  last_name: string;

  @ApiProperty({ example: 4 })
  total_periods: number;

  @ApiProperty({ example: 3 })
  present_count: number;

  @ApiProperty({ example: 1 })
  absent_count: number;

  @ApiProperty({ example: 0 })
  late_count: number;

  @ApiProperty({ example: 0 })
  excused_count: number;

  @ApiProperty({ example: 75.0 })
  attendance_percentage: number;
}

export class GetClassTermAttendanceQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for term attendance (YYYY-MM-DD)',
    example: '2025-09-01',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'End date for term attendance (YYYY-MM-DD)',
    example: '2025-12-20',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}
