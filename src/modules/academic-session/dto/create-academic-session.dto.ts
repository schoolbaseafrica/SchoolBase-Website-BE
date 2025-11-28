import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  IsOptional,
} from 'class-validator';

import { CreateTermDto } from '../../academic-term/dto/create-term.dto';

export type SessionTerms = {
  first_term: CreateTermDto;
  second_term: CreateTermDto;
  third_term: CreateTermDto;
};

export class CreateAcademicSessionDto {
  @IsOptional()
  @IsString({ message: 'Description must be a string.' })
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters.' })
  description?: string;

  @IsNotEmpty({ message: 'Terms array is required.' })
  @IsArray({ message: 'Terms must be an array.' })
  @ArrayMinSize(3, { message: 'Exactly 3 terms are required.' })
  @ArrayMaxSize(3, { message: 'Exactly 3 terms are required.' })
  @ValidateNested({ each: true })
  @Type(() => CreateTermDto)
  terms: SessionTerms;
}
