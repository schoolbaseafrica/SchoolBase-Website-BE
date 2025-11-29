import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateRoomDTO {
  @ApiProperty({
    description: 'Unique name of the room',
    example: 'Science Lab A',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Type of the room (e.g., Classroom, Laboratory)',
    example: 'Laboratory',
  })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Maximum capacity of the room',
    example: 30,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiProperty({
    description: 'Physical location of the room',
    example: 'North Wing',
  })
  @IsNotEmpty()
  @IsString()
  location: string;
}
