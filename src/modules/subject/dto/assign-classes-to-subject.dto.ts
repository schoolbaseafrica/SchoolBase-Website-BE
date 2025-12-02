import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ArrayNotEmpty, ArrayUnique } from 'class-validator';

export class AssignClassesToSubjectDto {
  @ApiProperty({
    type: [String],
    description: 'Array of class IDs to assign the subject to',
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'classIds array must not be empty' })
  @ArrayUnique({ message: 'classIds must not contain duplicates' })
  @IsUUID('all', { each: true })
  classIds: string[];
}
export class UnassignClassesToSubjectDto {
  @ApiProperty({
    type: [String],
    description: 'Array of class IDs to assign the subject to',
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'classIds array must not be empty' })
  @ArrayUnique({ message: 'classIds must not contain duplicates' })
  @IsUUID('all', { each: true })
  classIds: string[];
}
