import { ApiProperty } from '@nestjs/swagger';

export class GeneratePasswordResponseDto {
  @ApiProperty({
    description: 'Generated password',
    example: 'Kx9mP2vQ7nR4',
  })
  password: string;

  @ApiProperty({
    description: 'Password strength indicator',
    example: 'strong',
    enum: ['weak', 'medium', 'strong'],
  })
  strength: 'weak' | 'medium' | 'strong';
}
