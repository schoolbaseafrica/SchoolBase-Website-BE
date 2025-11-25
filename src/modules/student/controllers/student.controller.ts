import {
  Controller,
  Get,
  Param,
  Delete,
  Post,
  Body,
  Patch,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../shared/enums';
import { CreateStudentDto, StudentResponseDto, UpdateStudentDto } from '../dto';
import { StudentService } from '../services';

@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new student (ADMIN only)' })
  @ApiResponse({
    status: 201,
    description: 'Student created successfully',
    type: StudentResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email or Registration number already exists',
  })
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentService.create(createStudentDto);
  }

  @Get()
  findAll() {
    return this.studentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentService.update(id, updateStudentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentService.remove(id);
  }
}
