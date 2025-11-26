import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

import { RoomType } from '../enums/room-enum';

export class CreateRoomDTO {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(RoomType, { message: 'Type must be a valid room type' })
  type: RoomType;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsNotEmpty()
  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  building?: string;

  @IsOptional()
  @IsString()
  floor?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray({ message: 'Streams must be provided as an array' })
  @ArrayNotEmpty({ message: 'If providing streams, the list cannot be empty' })
  @IsUUID('4', { each: true, message: 'Invalid Stream ID provided' })
  streams?: string[];
}
