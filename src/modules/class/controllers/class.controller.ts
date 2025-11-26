import {
  Controller,
  Get,
  Param,
  Query,
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
import { DocsCreateClass, DocsGetClassTeachers } from '../docs/class.decorator';
import { CreateClassDto } from '../dto/create-class.dto';
import { GetTeachersQueryDto } from '../dto/get-teachers-query.dto';
import { TeacherAssignmentResponseDto } from '../dto/teacher-response.dto';
import { ClassService } from '../services/class.service';

@ApiTags('Classes')
@Controller('classes')
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  // --- POST: CREATE CLASS (ADMIN ONLY) ---
  @Post('')
  @DocsCreateClass()
  async create(@Body() createClassDto: CreateClassDto) {
    return this.classService.create(createClassDto);
  }

  @Get(':id/teachers')
  @DocsGetClassTeachers()
  async getTeachers(
    @Param('id', ParseUUIDPipe) classId: string,
    @Query() query: GetTeachersQueryDto,
  ): Promise<TeacherAssignmentResponseDto[]> {
    return this.classService.getTeachersByClass(classId, query.session_id);
  }
}
