import {
  BadRequestException,
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import * as sysMsg from '../../../constants/system.messages';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../shared/enums';
import { GradeSwagger, updateGradeDocs } from '../docs/grade.swagger';
import { UpdateGradeDto } from '../dto';
import { GradeService } from '../services';

interface IRequestWithUser extends Request {
  user: {
    id: string;
    userId: string;
    teacher_id?: string;
    roles: UserRole[];
  };
}

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
}
