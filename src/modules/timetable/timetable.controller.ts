import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../shared/enums';

import { AddScheduleDocs, GetTimetableDocs } from './docs';
import { AddScheduleDto, GetTimetableResponseDto } from './dto/timetable.dto';
import { TimetableService } from './timetable.service';

@ApiTags('Timetables')
@Controller('timetables')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @ApiExcludeEndpoint()
  @Post()
  create() {
    return this.timetableService.create();
  }

  @Post('schedule')
  @UseGuards(JwtAuthGuard)
  @AddScheduleDocs()
  addSchedule(@Body() dto: AddScheduleDto) {
    return this.timetableService.addSchedule(dto);
  }

  @ApiExcludeEndpoint()
  @Get()
  findAll() {
    return this.timetableService.findAll();
  }

  @Get('class/:classId')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @GetTimetableDocs()
  findByClass(
    @Param('classId') classId: string,
  ): Promise<GetTimetableResponseDto> {
    return this.timetableService.findByClass(classId);
  }

  @ApiExcludeEndpoint()
  @Get('teacher/:teacher_id')
  findByTeacher() {
    return this.timetableService.findByTeacher();
  }

  @ApiExcludeEndpoint()
  @Get(':id')
  findOne() {
    return this.timetableService.findOne();
  }

  @ApiExcludeEndpoint()
  @Patch(':id')
  update() {
    return this.timetableService.update();
  }

  @ApiExcludeEndpoint()
  @Patch(':id/archive')
  archive() {
    return this.timetableService.archive();
  }

  @ApiExcludeEndpoint()
  @Delete(':id')
  remove() {
    return this.timetableService.remove();
  }
}
