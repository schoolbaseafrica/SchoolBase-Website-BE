import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, ValidateIf } from 'class-validator';

export class CreateInstallationDto {
  @ApiProperty({
    description: 'Name of the school',
    example: 'Green Valley High School',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'School logo file',
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  @ValidateIf(() => false) // Skip validation for file field
  logo?: unknown;

  @ApiProperty({
    description: 'Primary color for school branding',
    example: '#1E40AF',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'primary_color must be a valid hex color code',
  })
  primary_color?: string;

  @ApiProperty({
    description: 'Secondary color for school branding',
    example: '#3B82F6',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'secondary_color must be a valid hex color code',
  })
  secondary_color?: string;

  @ApiProperty({
    description: 'Accent color for school branding',
    example: '#60A5FA',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'accent_color must be a valid hex color code',
  })
  accent_color?: string;
}
