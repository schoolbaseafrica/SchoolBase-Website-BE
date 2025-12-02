import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'John',
    description: 'First name of the user',
  })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional({
    example: 'Doe',
    description: 'Last name of the user',
  })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional({
    example: 'Michael',
    description: 'Middle name of the user',
  })
  @IsOptional()
  @IsString()
  middle_name?: string;

  @ApiPropertyOptional({
    example: '+2348012345678',
    description: 'User phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.schoolbase.com/photos/user123.jpg',
    description: "URL to the user's profile photo",
  })
  @IsOptional()
  @IsString()
  photo_url?: string;

  @ApiPropertyOptional({
    example: '12 Adeola Odeku Street, Victoria Island, Lagos',
    description: 'Home address of the user',
  })
  @IsString()
  @IsOptional()
  homeAddress?: string;
}
