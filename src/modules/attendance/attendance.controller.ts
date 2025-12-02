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

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../shared/enums';

import { AttendanceService } from './attendance.service';
import {
  ApiAttendanceTags,
  ApiAttendanceBearerAuth,
  ApiBulkMarkAttendance,
  ApiGetScheduleAttendance,
  ApiUpdateAttendance,
  ApiGetStudentAttendance,
  ApiGetAttendanceRecords,
  ApiCheckAttendanceMarked,
} from './docs';
import {
  BulkMarkAttendanceDto,
  UpdateAttendanceDto,
  GetAttendanceQueryDto,
} from './dto';

interface IRequestWithUser extends Request {
  user: {
    userId: string;
    role: UserRole;
  };
}

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiAttendanceTags()
@ApiAttendanceBearerAuth()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // --- POST: BULK MARK ATTENDANCE (TEACHER ONLY) ---
  @Post('mark')
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.OK)
  @ApiBulkMarkAttendance()
  async markAttendance(
    @Req() req: IRequestWithUser,
    @Body() dto: BulkMarkAttendanceDto,
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

  // --- GET: STUDENT'S OWN ATTENDANCE (STUDENT ONLY) ---
  @Get('student/me')
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.OK)
  @ApiGetStudentAttendance()
  async getMyAttendance(
    @Req() req: IRequestWithUser,
    @Query() query: GetAttendanceQueryDto,
  ) {
    return this.attendanceService.getStudentAttendance(req.user.userId, query);
  }

  // --- GET: ALL ATTENDANCE RECORDS (ADMIN/TEACHER) ---
  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @HttpCode(HttpStatus.OK)
  @ApiGetAttendanceRecords()
  async getAttendanceRecords(@Query() query: GetAttendanceQueryDto) {
    return this.attendanceService.getAttendanceRecords(query);
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
}
