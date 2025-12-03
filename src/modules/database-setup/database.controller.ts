import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../shared/enums';

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
  // @UseGuards(SetupGuard)
  @HttpCode(HttpStatus.CREATED)
  @CreateDatabaseDocs() // <=== Swagger docs
  create(@Body() configureDatabaseDto: ConfigureDatabaseDto) {
    return this.databaseService.create(configureDatabaseDto);
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN) //todo: replace with super-admin
  @HttpCode(HttpStatus.OK)
  @UpdateDatabaseDocs() // <=== Swagger docs
  update(@Body() configureDatabaseDto: ConfigureDatabaseDto) {
    return this.databaseService.update(configureDatabaseDto);
  }
}
