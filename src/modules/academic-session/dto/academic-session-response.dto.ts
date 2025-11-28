import { ApiProperty } from '@nestjs/swagger';

export class AcademicSessionResponseDto {
  @ApiProperty({
    example: 'session_1_id',
    description: 'Unique ID of the academic session',
  })
  id: string;
  @ApiProperty({
    example: '2025/2026',
    description: 'Academic year (used as session name)',
  })
  academicYear: string;
  @ApiProperty({
    example: 'Session for 2025/2026 academic year',
    description: 'Optional description of the session',
    required: false,
  })
  description?: string;
  // @ApiProperty({ example: 'ACTIVE', description: 'Status of the session' })
  // status: string;
  // @ApiProperty({
  //   type: [TermResponseDto],
  //   description: 'Array of the 3 terms associated with this session',
  // })
  // terms: TermResponseDto[];
}
