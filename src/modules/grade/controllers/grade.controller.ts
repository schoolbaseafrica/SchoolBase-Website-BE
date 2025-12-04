import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { IRequestWithUser } from 'src/modules/result/utils/grading.util';

import * as sysMsg from '../../../constants/system.messages';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../shared/enums';
import {
  GradeSwagger,
  updateGradeDocs,
  getStudentGradesDocs,
} from '../docs/grade.swagger';
import { UpdateGradeDto } from '../dto';
import { GradeService } from '../services/grade.service';

@ApiTags(GradeSwagger.tags[0])
@Controller('grades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GradeController {
  constructor(private readonly gradeService: GradeService) {}

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
