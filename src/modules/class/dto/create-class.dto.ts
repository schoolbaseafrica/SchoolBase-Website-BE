import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export class CreateClassDto {
  @ApiProperty({
    example: 's1a2b3c4-5678-90ab-cdef-1234567890ab',
    description: 'The ID of the session where the class will be added',
  })
  @IsNotEmpty({ message: 'session_id is required' })
  @IsUUID('4', { message: 'session_id must be a valid UUID' })
  session_id: string;

  @ApiProperty({
    example: 'SSS 2',
    description: 'The name of the class. Letters, numbers, and spaces only.',
  })
  @IsNotEmpty({ message: 'Class name cannot be empty' })
  @Matches(/^[a-zA-Z0-9 ]+$/, {
    message: 'Class name can only contain letters, numbers, and spaces',
  })
  name: string;

  @ApiProperty({
    example: 'Science',
    description: 'Optional stream for the class, e.g., Science, Arts, Commerce',
    required: false,
  })
  @IsOptional()
  @IsString()
  stream?: string;
}
