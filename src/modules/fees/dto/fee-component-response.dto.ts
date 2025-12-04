import { ApiProperty } from '@nestjs/swagger';

export class FeeComponentResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the fee component',
    example: 'a9b8c7d6-e5f4-3210-fedc-ba9876543210',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the fee component',
    example: 'Tuition Fee',
  })
  name: string;

  @ApiProperty({
    description: 'The amount of the fee',
    example: 50000,
  })
  amount: number;

  @ApiProperty({
    description: 'The academic session associated with the fee',
    example: '2023/2024',
  })
  session: string;

  @ApiProperty({
    description: 'The academic term associated with the fee',
    example: 'First Term',
  })
  term: string;

  @ApiProperty({
    description: 'The frequency of the fee payment',
    example: 'Per Term',
  })
  frequency: string;
}
