import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../shared/enums';
import {
  ApiSubjectTags,
  ApiSubjectBearerAuth,
  ApiCreateSubject,
  ApiFindAllSubjects,
  ApiFindOneSubject,
  ApiDeleteSubject,
} from '../docs/subject.swagger';
import { CreateSubjectDto } from '../dto/create-subject.dto';
import { ListSubjectsDto } from '../dto/list-subjects.dto';
import { SubjectService } from '../services/subject.service';

@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiSubjectTags()
@ApiSubjectBearerAuth()
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateSubject()
  create(@Body() createSubjectDto: CreateSubjectDto) {
    return this.subjectService.create(createSubjectDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiFindAllSubjects()
  findAll(@Query() query: ListSubjectsDto) {
    return this.subjectService.findAll(query.page, query.limit);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiFindOneSubject()
  findOne(@Param('id') id: string) {
    return this.subjectService.findOne(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiDeleteSubject()
  remove(@Param('id') id: string) {
    return this.subjectService.remove(id);
  }
}
