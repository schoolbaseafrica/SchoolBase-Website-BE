import { ApiProperty } from '@nestjs/swagger';

export class StreamResponseDto {
  @ApiProperty({ 
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
    description: 'Unique Stream ID' 
})
  id: string;

  @ApiProperty({ 
    example: 'JSS1 A', 
    description: 'Name of the stream' 
})
  name: string;

  @ApiProperty({ 
    example: 45, 
    description: 'Number of students assigned to this stream' 
})
  studentCount: number;
}