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
  @HttpCode(HttpStatus.OK)
  @UpdateDatabaseDocs() // <=== Swagger docs
  update(@Body() configureDatabaseDto: ConfigureDatabaseDto) {
    return this.databaseService.update(configureDatabaseDto);
  }
}
