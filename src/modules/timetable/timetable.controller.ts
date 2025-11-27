import { Controller, Get, Post, Patch, Delete } from '@nestjs/common';

import { TimetableService } from './timetable.service';

@Controller('timetables')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Post()
  create() {
    return this.timetableService.create();
  }

  @Get()
  findAll() {
    return this.timetableService.findAll();
  }

  @Get('stream/:stream_id')
  findByStream() {
    return this.timetableService.findByStream();
  }

  @Get('teacher/:teacher_id')
  findByTeacher() {
    return this.timetableService.findByTeacher();
  }

  @Get(':id')
  findOne() {
    return this.timetableService.findOne();
  }

  @Patch(':id')
  update() {
    return this.timetableService.update();
  }

  @Patch(':id/archive')
  archive() {
    return this.timetableService.archive();
  }

  @Delete(':id')
  remove() {
    return this.timetableService.remove();
  }
}
