import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
  approveSubmissionDocs,
  createGradeSubmissionDocs,
  getSubmissionDocs,
  listTeacherSubmissionsDocs,
  rejectSubmissionDocs,
  submitForApprovalDocs,
} from '../docs/grade.swagger';
import {
  CreateGradeSubmissionDto,
  ListGradeSubmissionsDto,
  RejectSubmissionDto,
} from '../dto';
import { GradeSubmissionService } from '../services/grade-submission.service';

interface IRequestWithUser extends Request {
  user: {
    id: string;
    userId: string;
    teacher_id?: string;
    roles: UserRole[];
  };
}

@ApiTags('Grade Submissions')
@Controller('grades/submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GradeSubmissionController {
  constructor(private readonly service: GradeSubmissionService) {}

  @Post()
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
    return this.service.createSubmission(teacherId, createDto);
  }

  @Get()
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
    return this.service.listTeacherSubmissions(teacherId, listDto);
  }

  @Get(':id')
  @getSubmissionDocs()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async getSubmission(
    @Req() req: IRequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const isAdmin = req.user.roles.includes(UserRole.ADMIN);
    const teacherId = isAdmin ? undefined : req.user.teacher_id;
    return this.service.getSubmission(id, teacherId);
  }

  @Post(':id/submit')
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
    return this.service.submitForApproval(teacherId, id);
  }

  @Post(':id/approve')
  @approveSubmissionDocs()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async approveSubmission(
    @Req() req: IRequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.approveSubmission(id, req.user.id);
  }

  @Post(':id/reject')
  @rejectSubmissionDocs()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async rejectSubmission(
    @Req() req: IRequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { reason }: RejectSubmissionDto,
  ) {
    return this.service.rejectSubmission(id, req.user.id, reason);
  }
}
