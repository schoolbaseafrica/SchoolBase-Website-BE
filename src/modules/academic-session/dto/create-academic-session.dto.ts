import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
  IsOptional,
} from 'class-validator';

import { CreateTermDto } from '../../academic-term/dto/create-term.dto';

export class SessionTerms {
  @ValidateNested()
  @Type(() => CreateTermDto)
  @IsNotEmpty({ message: 'First term is required.' })
  first_term: CreateTermDto;

  @ValidateNested()
  @Type(() => CreateTermDto)
  @IsNotEmpty({ message: 'Second term is required.' })
  second_term: CreateTermDto;

  @ValidateNested()
  @Type(() => CreateTermDto)
  @IsNotEmpty({ message: 'Third term is required.' })
  third_term: CreateTermDto;
}

export class CreateAcademicSessionDto {
  @IsOptional()
  @IsString({ message: 'Description must be a string.' })
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters.' })
  description?: string;

  @IsNotEmpty({ message: 'Terms object is required.' })
  @ValidateNested()
  @Type(() => SessionTerms)
  terms: SessionTerms;
}
