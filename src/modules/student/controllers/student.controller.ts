import {
  Controller,
  Get,
  Param,
  Delete,
  Post,
  Body,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../shared/enums';
import {
  StudentSwagger,
  CreateStudentDocs,
  GetStudentDocs,
  ListStudentsDocs,
  UpdateStudentDocs,
  DeleteStudentDocs,
} from '../docs';
import {
  CreateStudentDto,
  ListStudentsDto,
  StudentResponseDto,
  PatchStudentDto,
} from '../dto';
import { StudentService } from '../services';

@ApiTags(StudentSwagger.tags[0])
@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @CreateStudentDocs()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createStudentDto: CreateStudentDto,
  ): Promise<StudentResponseDto> {
    return this.studentService.create(createStudentDto);
  }

  // --- GET: LIST ALL STUDENTS (with pagination and search) ---
  @Get()
  @ListStudentsDocs()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll(@Query() listStudentsDto: ListStudentsDto) {
    return this.studentService.findAll(listStudentsDto);
  }

  // --- GET: GET SINGLE STUDENT BY ID ---
  @Get(':id')
  @GetStudentDocs()
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  findOne(@Param('id') id: string) {
    return this.studentService.findOne(id);
  }

  @UpdateStudentDocs()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStudentDto: PatchStudentDto,
  ) {
    return this.studentService.update(id, updateStudentDto);
  }

  @DeleteStudentDocs()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentService.remove(id);
  }
}
