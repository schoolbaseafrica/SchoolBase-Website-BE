import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { UUID } from 'typeorm/driver/mongodb/bson.typings';

import { GetTeachersQueryDto } from '../dto/get-teachers-query.dto';
import { TeacherAssignmentResponseDto } from '../dto/teacher-response.dto';
import { ClassService } from '../services/class.service';

@ApiTags('Classes')
@Controller('classes')
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Get(':id/teachers')
  @ApiOperation({
    summary: 'Get teachers assigned to a class',
    description:
      'Returns a list of teachers assigned to a specific class ID. Filters by session if provided, otherwise uses current session.',
  })
  @ApiParam({ name: 'id', type: UUID, description: 'The Class ID' })
  @ApiOkResponse({
    description: 'List of assigned teachers.',
    type: [TeacherAssignmentResponseDto],
  })
  @ApiNotFoundResponse({ description: 'Class not found' })
  async getTeachers(
    @Param('id', ParseUUIDPipe) classId: string,
    @Query() query: GetTeachersQueryDto,
  ): Promise<TeacherAssignmentResponseDto[]> {
    return this.classService.getTeachersByClass(classId, query.session_id);
  }
}
