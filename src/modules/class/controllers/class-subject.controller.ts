import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Body,
  UseGuards,
  Query,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../shared/enums';
import {
  ClassSubjectSwagger,
  DocsListClassSubjects,
  DocsAssignTeacherToSubject,
  DocsUnassignTeacherFromSubject,
  DocsCreateClassSubjects,
} from '../docs';
import {
  AssignTeacherToClassSubjectRequestDto,
  BulkCreateClassSubjectRequestDto,
  ListClassSubjectQueryDto,
} from '../dto';
import { ClassSubjectService } from '../services/class-subject.service';

@ApiTags(ClassSubjectSwagger.tags[0])
@Controller('class-subjects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassSubjectController {
  constructor(private readonly service: ClassSubjectService) {}

  // --- POST: CREATE CLASS SUBJECTS ---
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @DocsCreateClassSubjects()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() { classId, subjectIds }: BulkCreateClassSubjectRequestDto) {
    return this.service.create(classId, subjectIds);
  }

  // --- GET: LIST CLASS SUBJECTS ---
  @Get()
  @UseGuards(JwtAuthGuard)
  @DocsListClassSubjects()
  async list(@Query() query: ListClassSubjectQueryDto) {
    return this.service.list(query);
  }

  // --- POST: ASSIGN TEACHER TO CLASS SUBJECT ---
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(':id/teacher')
  @DocsAssignTeacherToSubject()
  async assignTeacher(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { teacherId }: AssignTeacherToClassSubjectRequestDto,
  ) {
    return this.service.assignTeacher(id, teacherId);
  }

  // --- DELETE: DELETE TEACHER FROM CLASS SUBJECT ---
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @DocsUnassignTeacherFromSubject()
  @Delete(':id/teacher')
  @DocsAssignTeacherToSubject()
  @HttpCode(HttpStatus.NO_CONTENT)
  async unassignTeacher(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.unassignTeacher(id);
  }
}
