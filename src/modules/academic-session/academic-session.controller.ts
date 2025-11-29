import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../shared/enums';

import { AcademicSessionService } from './academic-session.service';
import {
  DocsCreateAcademicSession,
  DocsGetAllAcademicSessions,
  DocsGetAcademicSessionById,
  DocsUpdateAcademicSession,
  DocsDeleteAcademicSession,
} from './docs';
import {
  CreateAcademicSessionDto,
  UpdateAcademicSessionDto,
  GetAcademicSessionsQueryDto,
} from './dto';

@ApiTags('Academic Session')
@Controller('academic-session')
export class AcademicSessionController {
  constructor(
    private readonly academicSessionService: AcademicSessionService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @DocsCreateAcademicSession()
  create(@Body() createAcademicSessionDto: CreateAcademicSessionDto) {
    return this.academicSessionService.create(createAcademicSessionDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @DocsGetAllAcademicSessions()
  async findAll(@Query() query: GetAcademicSessionsQueryDto) {
    return this.academicSessionService.findAll({
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @DocsGetAcademicSessionById()
  findOne(@Param('id') id: string) {
    return this.academicSessionService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @DocsUpdateAcademicSession()
  update(@Param('id') id: string, @Body() updateDto: UpdateAcademicSessionDto) {
    return this.academicSessionService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @DocsDeleteAcademicSession()
  remove(@Param('id') id: string) {
    return this.academicSessionService.remove(id);
  }
}
