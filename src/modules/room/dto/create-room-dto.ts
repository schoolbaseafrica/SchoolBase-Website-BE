import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateRoomDTO {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsNotEmpty()
  @IsString()
  location: string;
}
