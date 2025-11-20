import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

import { ClassesService } from './classes.service';
import { GetTeachersQueryDto } from './dto/get-teachers-query.dto';
import { TeacherAssignmentResponseDto } from './dto/teacher-response.dto';

@ApiTags('Classes')
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get(':id/teachers')
  @ApiOperation({
    summary: 'Get teachers assigned to a class',
    description:
      'Returns a list of teachers assigned to a specific class ID. Filters by session if provided, otherwise uses current session.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'The Class ID' })
  @ApiResponse({
    status: 200,
    description: 'List of assigned teachers.',
    type: [TeacherAssignmentResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Class not found.' })
  @ApiResponse({ status: 500, description: 'Database connection failure.' })
  async getTeachers(
    @Param('id', ParseIntPipe) classId: number,
    @Query() query: GetTeachersQueryDto,
  ): Promise<TeacherAssignmentResponseDto[]> {
    return this.classesService.getTeachersByClass(classId, query.session_id);
  }
}
