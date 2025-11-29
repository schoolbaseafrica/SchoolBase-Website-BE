import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import * as sysMsg from '../../../constants/system.messages';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../shared/enums';
import {
  createGradeSubmissionDocs,
  getStudentsForClassDocs,
  getSubmissionDocs,
  GradeSwagger,
  listTeacherSubmissionsDocs,
  submitForApprovalDocs,
  updateGradeDocs,
  getStudentGradesDocs,
} from '../docs/grade.swagger';
import {
  CreateGradeSubmissionDto,
  ListGradeSubmissionsDto,
  UpdateGradeDto,
} from '../dto';
import { GradeService } from '../services/grade.service';

interface IRequestWithUser extends Request {
  user: {
    id: string;
    userId: string;
    teacher_id?: string;
    student_id?: string;
    parent_id?: string;
    roles: UserRole[];
  };
}

@ApiTags(GradeSwagger.tags[0])
@Controller('grades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GradeController {
  constructor(private readonly gradeService: GradeService) {}

  @Post('submissions')
  @createGradeSubmissionDocs()
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  async createSubmission(
    @Req() req: IRequestWithUser,
    @Body() createDto: CreateGradeSubmissionDto,
  ) {
    const teacherId = req.user.teacher_id;
    if (!teacherId) {
      throw new BadRequestException(sysMsg.TEACHER_PROFILE_NOT_FOUND);
    }
    return this.gradeService.createSubmission(teacherId, createDto);
  }

  @Get('submissions')
  @listTeacherSubmissionsDocs()
  @Roles(UserRole.TEACHER)
  async listTeacherSubmissions(
    @Req() req: IRequestWithUser,
    @Query() listDto: ListGradeSubmissionsDto,
  ) {
    const teacherId = req.user.teacher_id;
    if (!teacherId) {
      throw new BadRequestException(sysMsg.TEACHER_PROFILE_NOT_FOUND);
    }
    return this.gradeService.listTeacherSubmissions(teacherId, listDto);
  }

  @Get('submissions/:id')
  @getSubmissionDocs()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async getSubmission(
    @Req() req: IRequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const isAdmin = req.user.roles.includes(UserRole.ADMIN);
    const teacherId = isAdmin ? undefined : req.user.teacher_id;
    return this.gradeService.getSubmission(id, teacherId);
  }

  @Post('submissions/:id/submit')
  @submitForApprovalDocs()
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.OK)
  async submitForApproval(
    @Req() req: IRequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const teacherId = req.user.teacher_id;
    if (!teacherId) {
      throw new BadRequestException(sysMsg.TEACHER_PROFILE_NOT_FOUND);
    }
    return this.gradeService.submitForApproval(teacherId, id);
  }

  @Patch(':gradeId')
  @updateGradeDocs()
  @Roles(UserRole.TEACHER)
  async updateGrade(
    @Req() req: IRequestWithUser,
    @Param('gradeId', ParseUUIDPipe) gradeId: string,
    @Body() updateDto: UpdateGradeDto,
  ) {
    const teacherId = req.user.teacher_id;
    if (!teacherId) {
      throw new BadRequestException(sysMsg.TEACHER_PROFILE_NOT_FOUND);
    }
    return this.gradeService.updateGrade(teacherId, gradeId, updateDto);
  }

  @Get('class/:classId/students')
  @getStudentsForClassDocs()
  @Roles(UserRole.TEACHER)
  async getStudentsForClass(
    @Req() req: IRequestWithUser,
    @Param('classId', ParseUUIDPipe) classId: string,
    @Query('subject_id', ParseUUIDPipe) subjectId: string,
  ) {
    const teacherId = req.user.teacher_id;
    if (!teacherId) {
      throw new BadRequestException(sysMsg.TEACHER_PROFILE_NOT_FOUND);
    }
    const students = await this.gradeService.getStudentsForClass(
      classId,
      teacherId,
      subjectId,
    );
    return {
      message: sysMsg.STUDENTS_FETCHED,
      data: students,
    };
  }

  @Get('student/:studentId')
  @getStudentGradesDocs()
  @Roles(UserRole.STUDENT, UserRole.PARENT)
  async getStudentGrades(
    @Req() req: IRequestWithUser,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.gradeService.getStudentGrades(studentId, req.user);
  }
}
