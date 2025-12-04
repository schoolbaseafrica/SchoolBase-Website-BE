import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../shared/enums';

import {
  AddScheduleDocs,
  EditScheduleDocs,
  GetTimetableDocs,
  GetAllTimetableDocs,
} from './docs';
import {
  AddScheduleDto,
  GetTimetableResponseDto,
  UpdateScheduleDto,
} from './dto/timetable.dto';
import { DayOfWeek } from './enums/timetable.enums';
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

  @Put('schedule/:schedule_id')
  @UseGuards(JwtAuthGuard)
  @EditScheduleDocs()
  editSchedule(
    @Param('schedule_id') scheduleId: string,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.timetableService.editSchedule(scheduleId, dto);
  }

  // @ApiExcludeEndpoint()
  // @Get()
  // findAll() {
  //   return this.timetableService.findAll();
  // }

  @Get('view-time-table')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.STUDENT || UserRole.ADMIN)
  @GetAllTimetableDocs()
  getAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('day') day?: DayOfWeek,
  ) {
    return this.timetableService.getAll(page, limit, day);
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
