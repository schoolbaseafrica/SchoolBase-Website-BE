import { Controller, Get, Post, Patch, Delete } from '@nestjs/common';

import { TeacherSubjectService } from './teacher-subject.service';

@Controller('teacher-subjects')
export class TeacherSubjectController {
  constructor(private readonly teacherSubjectService: TeacherSubjectService) {}

  @Post()
  create() {
    return this.teacherSubjectService.create();
  }

  @Get()
  findAll() {
    return this.teacherSubjectService.findAll();
  }

  @Get(':id')
  findOne() {
    return this.teacherSubjectService.findOne();
  }

  @Patch(':id')
  update() {
    return this.teacherSubjectService.update();
  }

  @Patch(':id/archive')
  archive() {
    return this.teacherSubjectService.archive();
  }

  @Delete(':id')
  remove() {
    return this.teacherSubjectService.remove();
  }
}
