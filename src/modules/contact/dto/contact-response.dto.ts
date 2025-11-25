import { ApiProperty } from '@nestjs/swagger';

export class ContactResponseDto {
  @ApiProperty({
    example: '200',
    nullable: true,
  })
  status_code?: number;

  @ApiProperty({
    example: 'Contact message sent successfully',
    nullable: true,
  })
  message?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    nullable: true,
  })
  contact_id?: string;
}
