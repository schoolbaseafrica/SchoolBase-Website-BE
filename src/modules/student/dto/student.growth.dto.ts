import { ApiProperty } from '@nestjs/swagger';

export class StudentGrowthReportItemDto {
  @ApiProperty({ example: 'Primary 1', description: 'Name of the class' })
  class_name: string;

  @ApiProperty({
    example: 30,
    description: 'Number of new students in the class',
  })
  new_students: number;

  @ApiProperty({ example: 15, description: 'Number of boys in the class' })
  boys: number;

  @ApiProperty({ example: 15, description: 'Number of girls in the class' })
  girls: number;
}

export class StudentGrowthReportDataDto {
  @ApiProperty({
    example: '2025/2026',
    description: 'Academic year for the report',
  })
  academic_year: string;

  @ApiProperty({
    type: [StudentGrowthReportItemDto],
    description: 'List of class reports',
  })
  report: StudentGrowthReportItemDto[];
}

export class StudentGrowthReportResponseDto {
  @ApiProperty({ example: 'Student growth report generated successfully.' })
  message: string;

  @ApiProperty({ example: 200 })
  status_code: number;

  @ApiProperty({ type: StudentGrowthReportDataDto })
  data: StudentGrowthReportDataDto;
}
