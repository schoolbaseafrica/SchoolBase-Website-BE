import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  Post,
  Patch,
  Delete,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiExtraModels } from '@nestjs/swagger';

import * as sysMsg from '../../../constants/system.messages';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../shared/enums';
import {
  DocsCreateClass,
  DocsGetClassTeachers,
  DocsGetGroupedClasses,
  DocsUpdateClass,
  DocsDeleteClass,
  DocsGetClassById,
  DocsGetTotalClasses,
  DocsAssignStudents,
  DocsGetClassStudents,
  DocsGetTeacherClasses,
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

@ApiTags('Classes')
@ApiExtraModels(GroupedClassDto)
@Controller('classes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  // --- POST: CREATE CLASS (ADMIN ONLY) ---
  @Post('')
  @Roles(UserRole.ADMIN)
  @DocsCreateClass()
  async create(@Body() createClassDto: CreateClassDto) {
    return this.classService.create(createClassDto);
  }

  // --- GET: GROUPED CLASSES ---
  @Get('')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @DocsGetGroupedClasses()
  async getGroupedClasses(@Query() query: ListGroupedClassesDto) {
    return this.classService.getGroupedClasses(query.page, query.limit);
  }

  // --- PATCH: UPDATE CLASS (ADMIN ONLY) ---
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @DocsUpdateClass()
  async updateClass(
    @Param('id', ParseUUIDPipe) classId: string,
    @Body() updateClassDto: UpdateClassDto,
  ) {
    return this.classService.updateClass(classId, updateClassDto);
  }

  // --- GET: TOTAL NUMBER OF CLASSES ---
  @Get('count')
  @Roles(UserRole.ADMIN)
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
  @Roles(UserRole.ADMIN)
  @DocsAssignStudents()
  async assignStudents(
    @Param('id', ParseUUIDPipe) classId: string,
    @Body() assignStudentsDto: AssignStudentsToClassDto,
  ) {
    return this.classService.assignStudentsToClass(classId, assignStudentsDto);
  }

  // --- GET: GET CLASSES ASSIGNED TO TEACHER ---
  @Get('teacher/assigned')
  @Roles(UserRole.TEACHER)
  @DocsGetTeacherClasses()
  async getTeacherClasses(
    @Req() req: IRequestWithUser,
    @Query('session_id') sessionId?: string,
  ): Promise<ClassResponseDto[]> {
    const teacherId = req.user.teacher_id;
    if (!teacherId) {
      throw new BadRequestException(sysMsg.TEACHER_PROFILE_NOT_FOUND);
    }
    return this.classService.getClassesByTeacher(teacherId, sessionId);
  }

  // --- GET: GET STUDENTS IN CLASS ---
  @Get(':id/students')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @DocsGetClassStudents()
  async getStudents(
    @Param('id', ParseUUIDPipe) classId: string,
    @Query() query: GetStudentsQueryDto,
  ): Promise<StudentAssignmentResponseDto[]> {
    return this.classService.getStudentsByClass(classId, query.session_id);
  }

  @Get(':id/teachers')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @DocsGetClassTeachers()
  async getTeachers(
    @Param('id', ParseUUIDPipe) classId: string,
    @Query() query: GetTeachersQueryDto,
  ): Promise<TeacherAssignmentResponseDto[]> {
    return this.classService.getTeachersByClass(classId, query.session_id);
  }

  // --- GET: GET CLASS BY ID ---
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @DocsGetClassById()
  async getClassById(
    @Param('id', ParseUUIDPipe) classId: string,
  ): Promise<ClassResponseDto> {
    return this.classService.getClassById(classId);
  }
  // --- DELETE: SOFT DELETE CLASS (ADMIN ONLY) ---
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @DocsDeleteClass()
  async deleteClass(@Param('id', ParseUUIDPipe) classId: string) {
    return this.classService.deleteClass(classId);
  }
}
