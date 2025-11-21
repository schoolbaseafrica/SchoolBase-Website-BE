import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

import { ClassSwagger } from '../docs/class.swagger';
import { GetTeachersQueryDto } from '../dto/get-teachers-query.dto';
import { TeacherAssignmentResponseDto } from '../dto/teacher-response.dto';
import { ClassService } from '../services/class.service';

@ApiTags('Classes')
@Controller('classes')
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Get(':id/teachers')
  @ApiOperation(ClassSwagger.endpoints.getTeachers.operation)
  @ApiParam(ClassSwagger.endpoints.getTeachers.parameters.id)
  @ApiOkResponse(ClassSwagger.endpoints.getTeachers.responses.ok)
  @ApiNotFoundResponse(ClassSwagger.endpoints.getTeachers.responses.notFound)
  async getTeachers(
    @Param('id', ParseUUIDPipe) classId: string,
    @Query() query: GetTeachersQueryDto,
  ): Promise<TeacherAssignmentResponseDto[]> {
    return this.classService.getTeachersByClass(classId, query.session_id);
  }
}
