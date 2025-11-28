import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  Post,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiExtraModels } from '@nestjs/swagger';

import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../shared/enums';
import {
  DocsCreateClass,
  DocsGetClassTeachers,
  DocsGetGroupedClasses,
  DocsUpdateClass,
  DocsGetClassById,
  DocsGetTotalClasses,
  DocsAssignStudents,
  DocsGetClassStudents,
} from '../docs/class.decorator';
import {
  CreateClassDto,
  ListGroupedClassesDto,
  GroupedClassDto,
  UpdateClassDto,
  ClassResponseDto,
  GetTotalClassesQueryDto,
  AssignStudentsToClassDto,
  StudentAssignmentResponseDto,
  GetStudentsQueryDto,
} from '../dto';
import { GetTeachersQueryDto } from '../dto/get-teachers-query.dto';
import { TeacherAssignmentResponseDto } from '../dto/teacher-response.dto';
import { ClassService } from '../services/class.service';

@ApiTags('Classes')
@ApiExtraModels(GroupedClassDto)
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

  // --- GET: GROUPED CLASSES ---
  @Get('')
  @DocsGetGroupedClasses()
  async getGroupedClasses(@Query() query: ListGroupedClassesDto) {
    return this.classService.getGroupedClasses(query.page, query.limit);
  }

  // --- PATCH: UPDATE CLASS (ADMIN ONLY) ---
  @Patch(':id')
  @DocsUpdateClass()
  async updateClass(
    @Param('id', ParseUUIDPipe) classId: string,
    @Body() updateClassDto: UpdateClassDto,
  ) {
    return this.classService.updateClass(classId, updateClassDto);
  }

  // --- GET: TOTAL NUMBER OF CLASSES ---
  @Get('count')
  @DocsGetTotalClasses()
  async getTotalClasses(@Query() query: GetTotalClassesQueryDto) {
    return this.classService.getTotalClasses(
      query.sessionId,
      query.name,
      query.arm,
    );
  }

  // --- POST: ASSIGN STUDENTS TO CLASS (ADMIN ONLY) ---
  @Post(':id/students')
  @DocsAssignStudents()
  async assignStudents(
    @Param('id', ParseUUIDPipe) classId: string,
    @Body() assignStudentsDto: AssignStudentsToClassDto,
  ) {
    return this.classService.assignStudentsToClass(classId, assignStudentsDto);
  }

  // --- GET: GET STUDENTS IN CLASS ---
  @Get(':id/students')
  @DocsGetClassStudents()
  async getStudents(
    @Param('id', ParseUUIDPipe) classId: string,
    @Query() query: GetStudentsQueryDto,
  ): Promise<StudentAssignmentResponseDto[]> {
    return this.classService.getStudentsByClass(classId, query.session_id);
  }

  @Get(':id/teachers')
  @DocsGetClassTeachers()
  async getTeachers(
    @Param('id', ParseUUIDPipe) classId: string,
    @Query() query: GetTeachersQueryDto,
  ): Promise<TeacherAssignmentResponseDto[]> {
    return this.classService.getTeachersByClass(classId, query.session_id);
  }

  // --- GET: GET CLASS BY ID (ADMIN ONLY) ---
  @Get(':id')
  @DocsGetClassById()
  async getClassById(
    @Param('id', ParseUUIDPipe) classId: string,
  ): Promise<ClassResponseDto> {
    return this.classService.getClassById(classId);
  }
}
