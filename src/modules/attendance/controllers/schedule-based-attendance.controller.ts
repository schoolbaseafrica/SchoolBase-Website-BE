import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';

import { IRequestWithUser } from 'src/common/types/request.interface';

import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../shared/enums';
import {
  ApiAttendanceTags,
  ApiAttendanceBearerAuth,
  ApiBulkMarkAttendance,
  ApiGetScheduleAttendance,
  ApiUpdateAttendance,
  ApiGetStudentAttendance,
  ApiGetAttendanceRecords,
  ApiCheckAttendanceMarked,
} from '../docs';
import {
  MarkAttendanceDto,
  UpdateAttendanceDto,
  GetScheduleAttendanceQueryDto,
} from '../dto';
import { AttendanceService } from '../services/attendance.service';

@Controller('attendance/schedule-based')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiAttendanceTags()
@ApiAttendanceBearerAuth()
export class ScheduleBasedAttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // --- POST: MARK ATTENDANCE (TEACHER ONLY) ---
  @Post()
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.OK)
  @ApiBulkMarkAttendance()
  async markAttendance(
    @Req() req: IRequestWithUser,
    @Body() dto: MarkAttendanceDto,
  ) {
    return this.attendanceService.markAttendance(req.user.userId, dto);
  }

  // --- GET: SCHEDULE ATTENDANCE BY DATE (TEACHER/ADMIN) ---
  @Get('schedule/:scheduleId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiGetScheduleAttendance()
  async getScheduleAttendance(
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
    @Query('date') date: string,
  ) {
    return this.attendanceService.getScheduleAttendance(scheduleId, date);
  }

  // --- GET: STUDENT'S OWN ATTENDANCE (STUDENT ONLY) ---
  @Get('student/me')
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.OK)
  @ApiGetStudentAttendance()
  async getMyAttendance(
    @Req() req: IRequestWithUser,
    @Query() query: GetScheduleAttendanceQueryDto,
  ) {
    return this.attendanceService.getStudentAttendance(req.user.userId, query);
  }

  // --- GET: CHECK IF ATTENDANCE IS MARKED (TEACHER) ---
  @Get('check/:scheduleId/:date')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiCheckAttendanceMarked()
  async checkAttendanceMarked(
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
    @Param('date') date: string,
  ) {
    return this.attendanceService.isAttendanceMarked(scheduleId, date);
  }

  // --- GET: ALL ATTENDANCE RECORDS (ADMIN/TEACHER) ---
  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @HttpCode(HttpStatus.OK)
  @ApiGetAttendanceRecords()
  async getAttendanceRecords(@Query() query: GetScheduleAttendanceQueryDto) {
    return this.attendanceService.getAttendanceRecords(query);
  }

  // --- PATCH: UPDATE ATTENDANCE RECORD (TEACHER ONLY) ---
  @Patch(':id')
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.OK)
  @ApiUpdateAttendance()
  async updateAttendance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.attendanceService.updateAttendance(id, dto);
  }
}
