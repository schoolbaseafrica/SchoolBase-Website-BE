import {
  Controller,
  Get,
  Param,
  Delete,
  Post,
  Body,
  Patch,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CreateStudentDecorator } from '../decorators';
import { StudentSwagger } from '../docs/student.swagger';
import { CreateStudentDto, StudentResponseDto, UpdateStudentDto } from '../dto';
import { StudentService } from '../services';

@ApiTags(StudentSwagger.tags[0])
@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @CreateStudentDecorator()
  create(
    @Body() createStudentDto: CreateStudentDto,
  ): Promise<StudentResponseDto> {
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
