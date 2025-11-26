import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsPort,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

// enum for supported database types
export enum DatabaseType {
  POSTGRES = 'postgres',
  MYSQL = 'mysql',
  MARIADB = 'mariadb',
  SQLITE = 'sqlite',
  MSSQL = 'mssql',
}

export class ConfigureDatabaseDto {
  @ApiProperty({
    description: 'Database name',
    example: 'open_school_portal_db',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/, {
    message:
      'Database name can only contain letters, numbers, and underscores, and cannot start with a number',
  })
  database_name: string;

  @ApiProperty({
    description: 'Database type (postgres, mysql, mariadb, etc.)',
    example: 'postgres',
    enum: DatabaseType,
  })
  @IsEnum(DatabaseType)
  @IsNotEmpty()
  database_type: DatabaseType;

  @ApiProperty({
    description: 'Database host (hostname or IP address)',
    example: 'localhost',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(
    /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$|^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/,
    {
      message: 'Database host must be a valid hostname or IP address',
    },
  )
  @MaxLength(255)
  database_host: string;

  @ApiProperty({
    description: 'Database username (alphanumeric, underscores, hyphens only)',
    example: 'root',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Database username can only contain letters, numbers, underscores, and hyphens',
  })
  database_username: string;

  @ApiProperty({
    description: 'Database port (1-65535)',
    example: 5432,
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(65535)
  @IsPort()
  database_port: number;

  @ApiProperty({
    description: 'Database password',
    example: 'password',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(128)
  database_password: string;
}
