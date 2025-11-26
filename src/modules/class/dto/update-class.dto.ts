import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class UpdateClassDto {
  @ApiProperty({
    example: 'JSS1',
    description: 'The new name of the class (optional).',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim().replace(/\s+/g, ' ').toUpperCase()
      : value,
  )
  name?: string;

  @ApiProperty({
    example: 'A',
    description: 'The new arm of the class (optional).',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  arm?: string;
}
