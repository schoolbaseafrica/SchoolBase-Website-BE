import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  UseGuards,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/dto/auth.dto';
import { SetupGuard } from '../shared/guards/setup.guard';

import { DatabaseService } from './database.service';
import {
  CreateDatabaseDocs,
  UpdateDatabaseDocs,
} from './docs/database.swagger';
import { ConfigureDatabaseDto } from './dto/configure-database.dto';

@Controller('database')
@ApiTags('Database')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  //===> save database config (Super Admin) <====
  @Post()
  @UseGuards(SetupGuard)
  @HttpCode(HttpStatus.CREATED)
  @CreateDatabaseDocs() // <=== Swagger docs
  create(@Body() configureDatabaseDto: ConfigureDatabaseDto) {
    return this.databaseService.create(configureDatabaseDto);
  }

  @Put()
  @Roles(UserRole.ADMIN) //todo: replace with super admin when implemented
  @HttpCode(HttpStatus.OK)
  @UpdateDatabaseDocs() // <=== Swagger docs
  update(@Body() configureDatabaseDto: ConfigureDatabaseDto) {
    return this.databaseService.update(configureDatabaseDto);
  }
}
