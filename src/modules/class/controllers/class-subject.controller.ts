import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Body,
  UseGuards,
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
} from '../docs';
import { AssignTeacherToClassSubjectRequestDto } from '../dto';
import { ClassSubjectService } from '../services/class-subject.service';

@ApiTags(ClassSubjectSwagger.tags[0])
@Controller('classes/:classId/subjects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassSubjectController {
  constructor(private readonly classStudentService: ClassSubjectService) {}

  // --- GET: LIST CLASS SUBJECTS ---
  @Get('')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @DocsListClassSubjects()
  async list(@Param('classId', ParseUUIDPipe) classId: string) {
    return this.classStudentService.list(classId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(':subjectId/assign-teacher')
  @DocsAssignTeacherToSubject()
  async assignTeacher(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Param('subjectId', ParseUUIDPipe) subjectId: string,
    @Body() { teacherId }: AssignTeacherToClassSubjectRequestDto,
  ) {
    return this.classStudentService.assignTeacher(
      classId,
      subjectId,
      teacherId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @DocsUnassignTeacherFromSubject()
  @Post(':subjectId/unassign-teacher')
  @DocsAssignTeacherToSubject()
  async unassignTeacher(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Param('subjectId', ParseUUIDPipe) subjectId: string,
  ) {
    return this.classStudentService.unassignTeacher(classId, subjectId);
  }
}
