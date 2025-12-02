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
  ApiUpdateSubject,
  ApiDeleteSubject,
  ApiAssignClassesToSubject,
} from '../docs/subject.swagger';
import { AssignClassesToSubjectDto } from '../dto/assign-classes-to-subject.dto';
import { CreateSubjectDto } from '../dto/create-subject.dto';
import { ListSubjectsDto } from '../dto/list-subjects.dto';
import { UpdateSubjectDto } from '../dto/update-subject.dto';
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

  @Post(':subjectId/assign-classes')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiAssignClassesToSubject()
  assignClassesToSubject(
    @Param('subjectId') subjectId: string,
    @Body() dto: AssignClassesToSubjectDto,
  ) {
    return this.subjectService.assignClassesToSubject(subjectId, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @HttpCode(HttpStatus.OK)
  @ApiFindAllSubjects()
  findAll(@Query() query: ListSubjectsDto) {
    return this.subjectService.findAll(query.page, query.limit);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiUpdateSubject()
  update(@Param('id') id: string, @Body() updateSubjectDto: UpdateSubjectDto) {
    return this.subjectService.update(id, updateSubjectDto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
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
